"use server"

import { randomUUID } from "node:crypto"
import { pgQuery } from "@/lib/postgres"
import { createOrder, updateOrderMetadata } from "@/lib/db/orders"
import { getOrCreateCustomer } from "@/lib/db/customers"

type CheckoutPaymentMethod = "cash" | "transfer" | "card"
type MercadoPagoCashMethodId = "oxxo" | "paycash" | "bancomer"

interface CartItem {
  id: string
  name: string
  sku?: string
  price: number // centavos MXN
  quantity: number
  image?: string
  size?: string
  color?: string
}

interface ShippingData {
  name: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  neighborhood?: string
  phone: string
}

interface MercadoPagoPaymentData {
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  customerName: string
  shipping: ShippingData
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

interface MercadoPagoCardPaymentData extends MercadoPagoPaymentData {
  cardToken: string
  paymentMethodId: string
  installments: number
  issuerId?: string
}

interface MercadoPagoCashPaymentData extends MercadoPagoPaymentData {
  cashMethodId?: MercadoPagoCashMethodId
}

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com"
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN

type MercadoPagoPaymentType = "ticket" | "bank_transfer" | "atm"

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function centsToCurrency(value: number): number {
  return Number((value / 100).toFixed(2))
}

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

function getMercadoPagoErrorMessage(result: any, fallback: string): string {
  const causeMessage =
    result?.cause?.[0]?.description ||
    result?.cause?.[0]?.code ||
    null

  return causeMessage || result?.message || result?.error || fallback
}

async function getAvailablePaymentMethodId(
  paymentType: MercadoPagoPaymentType,
  preferredIds: string[],
): Promise<string | null> {
  if (!MERCADO_PAGO_ACCESS_TOKEN) return null

  const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payment_methods`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) return null

  const methods = await response.json()
  const active = Array.isArray(methods)
    ? methods.filter((m: any) => m?.status === "active" && m?.payment_type_id === paymentType)
    : []

  try {
    console.log(`[mp] getAvailablePaymentMethodId: paymentType=${paymentType} preferred=${preferredIds.join(',')} active_count=${active.length}`)
  } catch (e) {
    console.error('[mp] getAvailablePaymentMethodId: logging error', e)
  }

  if (active.length === 0) return null

  for (const preferred of preferredIds) {
    const match = active.find((m: any) => m?.id === preferred)
    if (match?.id) return match.id
  }

  // If no preferred match, return first active if any and log
  if (active.length > 0) {
    try {
      console.log(`[mp] getAvailablePaymentMethodId: falling back to ${active[0].id}`)
    } catch (e) {
      console.error('[mp] getAvailablePaymentMethodId: logging error', e)
    }
    return active[0].id
  }

  return active[0]?.id || null
}

function getPaymentInstructions(payment: any, paymentMethod: CheckoutPaymentMethod) {
  const transactionData = payment?.point_of_interaction?.transaction_data ?? {}
  const paymentMethodData = payment?.transaction_details ?? {}
  const paymentData = payment?.payment_method?.data ?? {}
  const externalResourceUrl =
    paymentMethodData?.external_resource_url ??
    paymentData?.external_resource_url ??
    null

  const extractNumericValue = (value: unknown): string | null => {
    if (typeof value !== "string") return null
    const digits = value.replace(/\D/g, "")
    return digits.length >= 10 ? digits : null
  }

  if (paymentMethod === "cash") {
    const ticketUrlCandidate =
      transactionData?.ticket_url ??
      transactionData?.external_resource_url ??
      null

    const normalizedTicketUrl =
      typeof ticketUrlCandidate === "string" && /^https?:\/\//i.test(ticketUrlCandidate)
        ? ticketUrlCandidate
        : null

    const normalizedExternalResourceUrl =
      typeof externalResourceUrl === "string" && /^https?:\/\//i.test(externalResourceUrl)
        ? externalResourceUrl
        : null

    const paymentReference =
      paymentMethodData?.payment_method_reference_id ??
      payment?.barcode?.content ??
      payment?.payment_method?.data?.reference ??
      null

    const officialBarcodeContent =
      paymentMethodData?.barcode?.content ??
      payment?.barcode?.content ??
      paymentMethodData?.verification_code ??
      null

    const barcodeUrl =
      transactionData?.barcode_url ??
      transactionData?.ticket_url ??
      null

    return {
      reference:
        transactionData?.reference_number ??
        transactionData?.payment_reference ??
        paymentReference ??
        normalizedExternalResourceUrl?.match(/reference=([^&]+)/)?.[1] ??
        null,
      barcodeUrl,
      barcodeContent: officialBarcodeContent,
      paymentUrl: normalizedTicketUrl ?? normalizedExternalResourceUrl,
      expiresAt:
        payment?.date_of_expiration ??
        null,
    }
  }

  return {
    clabe:
      extractNumericValue(transactionData?.bank_info?.account_number) ??
      extractNumericValue(transactionData?.account_number) ??
      extractNumericValue(transactionData?.clabe) ??
      extractNumericValue(paymentData?.reference_id) ??
      extractNumericValue(paymentData?.external_reference_id) ??
      transactionData?.bank_transfer_id ??
      transactionData?.financial_institution ??
      transactionData?.reference ??
      null,
    bank:
      transactionData?.financial_institution ??
      null,
    reference:
      transactionData?.reference ??
      externalResourceUrl ??
      null,
    paymentUrl:
      externalResourceUrl,
    expiresAt:
      payment?.date_of_expiration ??
      null,
  }
}

async function createMercadoPagoPendingOrder(data: MercadoPagoPaymentData, paymentMethod: CheckoutPaymentMethod) {
  const validItems = data.items.filter((item) => isValidUUID(item.id))
  if (validItems.length === 0) {
    return { error: "Your cart contains outdated products. Please clear your cart and try again." as const }
  }

  const productIds = validItems.map((item) => item.id)
  const productsResult = await pgQuery<{
    id: string
    name: string
    price: number
    status: string
    main_image: string | null
  }>(
    `SELECT id, name, price, status, main_image
     FROM public.products
     WHERE id = ANY($1::uuid[])`,
    [productIds],
  )
  const products = productsResult.rows

  if (!products || products.length === 0) {
    return { error: "Error validating products" as const }
  }

  const productMap = new Map(products.map((product) => [product.id, product]))

  for (const item of validItems) {
    const product = productMap.get(item.id)
    if (!product) return { error: `Product not found: ${item.name}` as const }
    if (product.status !== "active") return { error: `Product not available: ${item.name}` as const }
  }

  const customer = await getOrCreateCustomer(data.customerEmail, {
    name: data.customerName,
    phone: data.customerPhone,
    address: data.shipping.address,
    city: data.shipping.city,
    state: data.shipping.state,
    neighborhood: data.shipping.neighborhood,
    country: data.shipping.country,
    postal_code: data.shipping.postalCode,
  })

  if (!customer) {
    return { error: "Could not create customer record" as const }
  }

  const order = await createOrder({
    customer_id: customer.id,
    customer_email: data.customerEmail,
    customer_name: data.customerName,
    status: "pending",
    subtotal: data.subtotal,
    shipping: data.shippingCost,
    tax: data.tax,
    total: data.total,
    shipping_address: data.shipping.address,
    shipping_city: data.shipping.city,
    shipping_state: data.shipping.state,
    shipping_neighborhood: data.shipping.neighborhood,
    shipping_country: data.shipping.country,
    shipping_postal_code: data.shipping.postalCode,
    notes: `Mercado Pago Method: ${paymentMethod}`,
    items: validItems.map((item) => {
      const product = productMap.get(item.id)
      const unitPrice = product?.price ?? item.price

      return {
        product_id: item.id,
        product_name: product?.name || item.name,
        product_sku: item.sku || item.id,
        product_image: item.image || product?.main_image || undefined,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
        variant_size: item.size,
        variant_color: item.color,
      }
    }),
  })

  if (!order) {
    return { error: "Could not create pending order" as const }
  }

  // Debug: log created order summary
  try {
    console.log(`[mp] createMercadoPagoPendingOrder: order created id=${order.id} order_number=${order.order_number} paymentMethod=${paymentMethod}`)
  } catch (e) {
    console.error('[mp] createMercadoPagoPendingOrder: logging error', e)
  }

  return { order }
}

async function createMercadoPagoPayment(
  orderId: string,
  data: MercadoPagoPaymentData,
  paymentMethod: CheckoutPaymentMethod,
  cashMethodId?: MercadoPagoCashMethodId,
) {
  if (!MERCADO_PAGO_ACCESS_TOKEN) {
    return { error: "MERCADO_PAGO_ACCESS_TOKEN is not configured" as const }
  }

  const appUrl = getAppUrl()
  const isHttpsAppUrl = appUrl.startsWith("https://")

  const paymentMethodId =
    paymentMethod === "cash"
      ? cashMethodId === "bancomer"
        ? await getAvailablePaymentMethodId("atm", ["bancomer"])
        : cashMethodId === "paycash"
        ? await getAvailablePaymentMethodId("ticket", ["paycash", "oxxo"])
        : await getAvailablePaymentMethodId("ticket", ["oxxo", "paycash"])
      : await getAvailablePaymentMethodId("bank_transfer", ["clabe", "spei", "banamex"])

  if (!paymentMethodId) {
    return { error: `No available payment method found for ${paymentMethod}.` as const }
  }

  try {
    console.log(`[mp] createMercadoPagoPayment: orderId=${orderId} chosen_paymentMethodId=${paymentMethodId} paymentMethod=${paymentMethod}`)
  } catch (e) {
    console.error('[mp] createMercadoPagoPayment: logging error', e)
  }

  const body: any = {
    transaction_amount: centsToCurrency(data.total),
    description: `Order ${orderId}`,
    payment_method_id: paymentMethodId,
    external_reference: orderId,
    payer: {
      email: data.customerEmail,
      first_name: data.customerName.split(" ")[0] || data.customerName,
      last_name: data.customerName.split(" ").slice(1).join(" ") || "Cliente",
      ...(paymentMethod === "transfer" ? { entity_type: "individual" } : {}),
    },
    metadata: {
      order_id: orderId,
      source: "atelier_checkout",
      payment_method: paymentMethod,
    },
  }

  if (isHttpsAppUrl) {
    body.notification_url = `${appUrl}/api/webhooks/mercadopago`
  }

  // Debug: log outgoing request body (safe fields only)
  try {
    const safeBody = Object.assign({}, body)
    if (safeBody.payer) {
      // avoid logging unexpected sensitive tokens
      safeBody.payer = {
        email: safeBody.payer.email,
        first_name: safeBody.payer.first_name,
        last_name: safeBody.payer.last_name,
      }
    }
    console.log(`[mp] createMercadoPagoPayment: sending request`, JSON.stringify(safeBody))
  } catch (e) {
    console.error('[mp] createMercadoPagoPayment: error logging request body', e)
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  })

  let result: any = null
  let responseText: string | null = null
  try {
    // Attempt to parse JSON, fallback to text if parsing fails
    result = await response.json()
  } catch (err) {
    try {
      responseText = await response.text()
    } catch (e) {
      responseText = null
    }
    result = { message: 'non_json_response', text: responseText }
  }

  try {
    console.log(`[mp] createMercadoPagoPayment: response_status=${response.status} ok=${response.ok} orderId=${orderId}`)
  } catch (e) {
    console.error('[mp] createMercadoPagoPayment: logging error', e)
  }

  if (!response.ok) {
    try {
      console.error('[mp] createMercadoPagoPayment: api error', result)
      try {
        console.error('[mp] createMercadoPagoPayment: response headers', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
        })
      } catch (e) {
        console.error('[mp] createMercadoPagoPayment: error logging response headers', e)
      }

      if (responseText) {
        console.error('[mp] createMercadoPagoPayment: response_text', responseText)
      }
    } catch (e) {
      console.error('[mp] createMercadoPagoPayment: error logging api error', e)
    }
    return { error: getMercadoPagoErrorMessage(result, "Error creating Mercado Pago payment") as const }
  }

  // Re-fetch payment detail because some offline fields (reference/barcode URL) are populated there.
  try {
    const detailResponse = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${result.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })
    const detail = await detailResponse.json()
    try {
      console.log(`[mp] createMercadoPagoPayment: detail_status=${detailResponse.status} ok=${detailResponse.ok} id=${result.id}`)
    } catch (e) {
      console.error('[mp] createMercadoPagoPayment: logging error', e)
    }
    if (detailResponse.ok) {
      return { payment: detail, paymentMethodId }
    }
  } catch {
    // fallback to original response
  }

  return { payment: result, paymentMethodId }
}

async function createMercadoPagoCardPayment(orderId: string, data: MercadoPagoCardPaymentData) {
  if (!MERCADO_PAGO_ACCESS_TOKEN) {
    return { error: "MERCADO_PAGO_ACCESS_TOKEN is not configured" as const }
  }

  const appUrl = getAppUrl()
  const isHttpsAppUrl = appUrl.startsWith("https://")

  const body: any = {
    transaction_amount: centsToCurrency(data.total),
    token: data.cardToken,
    description: `Order ${orderId}`,
    installments: Math.max(1, data.installments),
    payment_method_id: data.paymentMethodId,
    external_reference: orderId,
    payer: {
      email: data.customerEmail,
      first_name: data.customerName.split(" ")[0] || data.customerName,
      last_name: data.customerName.split(" ").slice(1).join(" ") || "Cliente",
    },
    metadata: {
      order_id: orderId,
      source: "atelier_checkout",
      payment_method: "card",
    },
  }
  if (data.issuerId) {
    body.issuer_id = data.issuerId
  }

  // Debug: log payment attempt summary (mask sensitive values)
  try {
    console.log(`[mp] createMercadoPagoCardPayment: orderId=${orderId} transaction_amount=${body.transaction_amount} installments=${body.installments} payment_method_id=${body.payment_method_id} token_len=${String(data.cardToken || '').length}`)
  } catch (e) {
    console.error('[mp] createMercadoPagoCardPayment: logging error', e)
  }

  if (isHttpsAppUrl) {
    body.notification_url = `${appUrl}/api/webhooks/mercadopago`
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  })

  const result = await response.json()

  if (!response.ok) {
    return { error: getMercadoPagoErrorMessage(result, "Error creating card payment") as const }
  }

  return { payment: result }
}

export async function createMercadoPagoCashOrder(data: MercadoPagoCashPaymentData) {
  try {
    console.log(`[mp] createMercadoPagoCashOrder called: customer=${data.customerEmail} total=${data.total} cashMethod=${data.cashMethodId || 'unknown'}`)
    const orderResult = await createMercadoPagoPendingOrder(data, "cash")
    if ("error" in orderResult) {
      return { error: orderResult.error }
    }

    const { order } = orderResult
    const paymentResult = await createMercadoPagoPayment(order.id, data, "cash", data.cashMethodId)

    if ("error" in paymentResult) {
      await updateOrderMetadata(order.id, {
        status: "cancelled",
        notes: `Mercado Pago payment error: ${paymentResult.error}`,
      })

      return { error: paymentResult.error }
    }

    const instructions = getPaymentInstructions(paymentResult.payment, "cash")

    await updateOrderMetadata(order.id, {
        notes: `Mercado Pago Method: cash | Payment Method ID: ${paymentResult.paymentMethodId} | Payment: ${paymentResult.payment.id}`,
      })

    return {
      success: true,
      orderNumber: order.order_number,
      reference: instructions.reference,
      barcodeUrl: instructions.barcodeUrl,
      barcodeContent: instructions.barcodeContent,
      paymentUrl: instructions.paymentUrl,
      expiresAt: instructions.expiresAt,
    }
  } catch (err) {
    console.error("Mercado Pago cash payment error:", err)
    return { error: "Connection error with payment processor" }
  }
}

export async function createMercadoPagoSpeiOrder(data: MercadoPagoPaymentData) {
  try {
    console.log(`[mp] createMercadoPagoSpeiOrder called: customer=${data.customerEmail} total=${data.total}`)
    const orderResult = await createMercadoPagoPendingOrder(data, "transfer")
    if ("error" in orderResult) {
      return { error: orderResult.error }
    }

    const { order } = orderResult
    const paymentResult = await createMercadoPagoPayment(order.id, data, "transfer")

    if ("error" in paymentResult) {
      await updateOrderMetadata(order.id, {
        status: "cancelled",
        notes: `Mercado Pago payment error: ${paymentResult.error}`,
      })

      return { error: paymentResult.error }
    }

    const instructions = getPaymentInstructions(paymentResult.payment, "transfer")

    await updateOrderMetadata(order.id, {
        notes: `Mercado Pago Method: transfer | Payment: ${paymentResult.payment.id}`,
      })

    return {
      success: true,
      orderNumber: order.order_number,
      clabe: instructions.clabe,
      bank: instructions.bank,
      reference: instructions.reference,
      paymentUrl: instructions.paymentUrl,
      expiresAt: instructions.expiresAt,
    }
  } catch (err) {
    console.error("Mercado Pago SPEI payment error:", err)
    return { error: "Connection error with payment processor" }
  }
}

export async function createMercadoPagoCardOrder(data: MercadoPagoCardPaymentData) {
  try {
    console.log(`[mp] createMercadoPagoCardOrder called: customer=${data.customerEmail} total=${data.total} items=${data.items.length}`)
    const orderResult = await createMercadoPagoPendingOrder(data, "card")
    if ("error" in orderResult) {
      return { error: orderResult.error }
    }

    const { order } = orderResult
    const paymentResult = await createMercadoPagoCardPayment(order.id, data)

    if ("error" in paymentResult) {
      await updateOrderMetadata(order.id, {
        status: "cancelled",
        notes: `Mercado Pago card payment error: ${paymentResult.error}`,
      })

      return { error: paymentResult.error }
    }

    const mpStatus = paymentResult.payment?.status as string | undefined
    const mappedStatus =
      mpStatus === "approved"
        ? "paid"
        : mpStatus === "refunded" || mpStatus === "charged_back"
        ? "refunded"
        : mpStatus === "rejected" || mpStatus === "cancelled"
        ? "cancelled"
        : "pending"

    await updateOrderMetadata(order.id, {
        status: mappedStatus,
        notes: `Mercado Pago Method: card | Payment: ${paymentResult.payment.id} (${mpStatus || "unknown"})`,
      })

    return {
      success: true,
      orderNumber: order.order_number,
      status: mappedStatus,
    }
  } catch (err) {
    console.error("Mercado Pago card payment error:", err)
    return { error: "Connection error with payment processor" }
  }
}
