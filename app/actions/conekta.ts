"use server"

import { createClient } from "@/lib/supabase/server"
import { createOrder } from "@/lib/db/orders"
import { getOrCreateCustomer } from "@/lib/db/customers"

const CONEKTA_API_URL = "https://api.conekta.io"
const CONEKTA_PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY!
const CONEKTA_PUBLIC_KEY = process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY!

function getConektaAuthHeader(): string {
  return `Basic ${Buffer.from(`${CONEKTA_PRIVATE_KEY}:`).toString("base64")}`
}

// Step 1: Create a token (checkout session) for the iframe
export async function createConektaToken(data: {
  amount: number // in centavos MXN
  currency?: string
  monthlyInstallments?: number[]
}) {
  try {
    const response = await fetch(`${CONEKTA_API_URL}/tokens`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.conekta-v2.1.0+json",
        "Content-Type": "application/json",
        "Authorization": getConektaAuthHeader(),
      },
      body: JSON.stringify({
        checkout: {
          allowed_payment_methods: ["card"],
          monthly_installments_enabled: true,
          monthly_installments_options: data.monthlyInstallments || [3, 6, 9, 12],
          returns_control_on: "Token",
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Conekta token error:", result)
      return { error: result.details?.[0]?.message || result.message || "Error creating payment session" }
    }

    return {
      tokenId: result.id,
      checkoutId: result.checkout?.id,
    }
  } catch (err) {
    console.error("Conekta token error:", err)
    return { error: "Error connecting to payment processor" }
  }
}

// Get public key for client-side SDK
export async function getConektaPublicKey() {
  return CONEKTA_PUBLIC_KEY || null
}

// Helper to validate UUID
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

interface CartItem {
  id: string
  name: string
  sku?: string
  price: number // in centavos MXN
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
  phone: string
}

// Step 3: Create order and charge with the token
export async function createConektaOrder(data: {
  tokenId: string
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  customerName: string
  shipping: ShippingData
  subtotal: number // centavos
  shippingCost: number // centavos
  tax: number // centavos
  total: number // centavos
  monthlyInstallments?: number // 0 = single charge, 3/6/9/12 = MSI
}) {
  try {
    const supabase = await createClient()

    // Filter valid items
    const validItems = data.items.filter(item => isValidUUID(item.id))
    if (validItems.length === 0) {
      return { error: "Your cart contains outdated products. Please clear your cart and try again." }
    }

    // Validate products in DB
    const productIds = validItems.map(item => item.id)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status, main_image")
      .in("id", productIds)

    if (error || !products || products.length === 0) {
      return { error: "Error validating products" }
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of validItems) {
      const product = productMap.get(item.id)
      if (!product) return { error: `Product not found: ${item.name}` }
      if (product.status !== "active") return { error: `Product not available: ${item.name}` }
    }

    // Build Conekta line_items (amounts in centavos)
    const lineItems = validItems.map(item => {
      const product = productMap.get(item.id)
      return {
        name: (product?.name || item.name).substring(0, 250),
        unit_price: product?.price || item.price, // centavos
        quantity: item.quantity,
        sku: item.sku || item.id,
        tags: ["atelier"],
      }
    })

    // Build charges array
    const chargePayload: any = {
      payment_method: {
        type: "card",
        token_id: data.tokenId,
      },
    }

    // Add MSI if selected (only for amounts >= $300 MXN for 3 MSI)
    if (data.monthlyInstallments && data.monthlyInstallments > 0) {
      chargePayload.payment_method.monthly_installments = data.monthlyInstallments
    }

    // Build order payload
    const orderPayload: any = {
      currency: "MXN",
      customer_info: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
      line_items: lineItems,
      charges: [chargePayload],
      tax_lines: [
        {
          description: "IVA",
          amount: data.tax, // centavos
        },
      ],
      shipping_lines: [
        {
          amount: data.shippingCost, // centavos
          carrier: data.shippingCost > 2000 ? "Express" : "Standard",
        },
      ],
      shipping_contact: {
        receiver: data.customerName,
        phone: data.customerPhone,
        address: {
          street1: data.shipping.address,
          city: data.shipping.city,
          state: data.shipping.state || data.shipping.city,
          country: "mx",
          postal_code: data.shipping.postalCode,
          residential: true,
        },
      },
      metadata: {
        integration: "Atelier Web",
        source: "checkout",
      },
    }

    // Call Conekta Orders API
    const response = await fetch(`${CONEKTA_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.conekta-v2.1.0+json",
        "Content-Type": "application/json",
        "Authorization": getConektaAuthHeader(),
      },
      body: JSON.stringify(orderPayload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Conekta order error:", result)
      const errorMsg = result.details?.[0]?.message || result.message || "Payment processing error"
      return { error: errorMsg }
    }

    // Check payment status
    const charge = result.charges?.data?.[0]
    const paymentStatus = charge?.status || result.payment_status

    if (paymentStatus === "paid" || paymentStatus === "pre_authorized") {
      // Create customer and order in our DB
      try {
        const customer = await getOrCreateCustomer(data.customerEmail, {
          name: data.customerName,
          phone: data.customerPhone,
          address: data.shipping.address,
          city: data.shipping.city,
          country: data.shipping.country,
          postal_code: data.shipping.postalCode,
        })

        if (customer) {
          const order = await createOrder({
            customer_id: customer.id,
            customer_email: data.customerEmail,
            customer_name: data.customerName,
            status: "paid",
            subtotal: data.subtotal,
            shipping: data.shippingCost,
            tax: data.tax,
            total: data.total,
            shipping_address: data.shipping.address,
            shipping_city: data.shipping.city,
            shipping_country: data.shipping.country,
            shipping_postal_code: data.shipping.postalCode,
            notes: `Conekta Order: ${result.id} | Charge: ${charge?.id || "N/A"}${data.monthlyInstallments ? ` | MSI: ${data.monthlyInstallments}` : ""}`,
            items: validItems.map(item => {
              const product = productMap.get(item.id)
              return {
                product_id: item.id,
                product_name: product?.name || item.name,
                product_sku: item.sku || item.id,
                product_image: item.image || product?.main_image || null,
                quantity: item.quantity,
                unit_price: product?.price || item.price,
                total_price: (product?.price || item.price) * item.quantity,
                variant_size: item.size,
                variant_color: item.color,
              }
            }),
          })

          return {
            success: true,
            conektaOrderId: result.id,
            chargeId: charge?.id,
            orderNumber: order?.order_number,
            paymentStatus,
          }
        }
      } catch (orderError) {
        console.error("Error creating order in DB:", orderError)
      }

      return {
        success: true,
        conektaOrderId: result.id,
        chargeId: charge?.id,
        paymentStatus,
      }
    } else if (paymentStatus === "pending_payment") {
      // 3DS required or pending
      const threeDsUrl = charge?.payment_method?.redirect_url
      return {
        pending: true,
        conektaOrderId: result.id,
        redirectUrl: threeDsUrl,
        paymentStatus,
      }
    } else {
      return {
        error: getConektaErrorMessage(charge?.failure_code),
      }
    }
  } catch (err) {
    console.error("Conekta order error:", err)
    return { error: "Connection error with payment processor" }
  }
}

// Create OXXO cash order - returns a reference number for the customer to pay at OXXO
export async function createConektaOxxoOrder(data: {
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  customerName: string
  shipping: ShippingData
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}) {
  try {
    const supabase = await createClient()

    const validItems = data.items.filter(item => isValidUUID(item.id))
    if (validItems.length === 0) {
      return { error: "Your cart contains outdated products. Please clear your cart and try again." }
    }

    const productIds = validItems.map(item => item.id)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status, main_image")
      .in("id", productIds)

    if (error || !products || products.length === 0) {
      return { error: "Error validating products" }
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of validItems) {
      const product = productMap.get(item.id)
      if (!product) return { error: `Product not found: ${item.name}` }
      if (product.status !== "active") return { error: `Product not available: ${item.name}` }
    }

    const lineItems = validItems.map(item => {
      const product = productMap.get(item.id)
      return {
        name: (product?.name || item.name).substring(0, 250),
        unit_price: product?.price || item.price,
        quantity: item.quantity,
        sku: item.sku || item.id,
        tags: ["atelier"],
      }
    })

    // Expire in 3 days
    const expiresAt = Math.round(Date.now() / 1000 + 60 * 60 * 24 * 3)

    const orderPayload = {
      currency: "MXN",
      customer_info: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
      line_items: lineItems,
      charges: [{
        payment_method: {
          type: "oxxo_cash",
          expires_at: expiresAt,
        },
      }],
      tax_lines: [{
        description: "IVA",
        amount: data.tax,
      }],
      shipping_lines: [{
        amount: data.shippingCost,
        carrier: data.shippingCost > 20000 ? "Express" : "Standard",
      }],
      shipping_contact: {
        receiver: data.customerName,
        phone: data.customerPhone,
        address: {
          street1: data.shipping.address,
          city: data.shipping.city,
          state: data.shipping.state || data.shipping.city,
          country: "mx",
          postal_code: data.shipping.postalCode,
          residential: true,
        },
      },
      metadata: {
        integration: "Atelier Web",
        source: "checkout",
        payment_type: "oxxo_cash",
      },
    }

    const response = await fetch(`${CONEKTA_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.conekta-v2.1.0+json",
        "Content-Type": "application/json",
        "Authorization": getConektaAuthHeader(),
      },
      body: JSON.stringify(orderPayload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Conekta OXXO order error:", result)
      return { error: result.details?.[0]?.message || result.message || "Error creating OXXO payment" }
    }

    const charge = result.charges?.data?.[0]
    const reference = charge?.payment_method?.reference
    const barcodeUrl = charge?.payment_method?.barcode_url

    // Save order in DB as pending
    try {
      const customer = await getOrCreateCustomer(data.customerEmail, {
        name: data.customerName,
        phone: data.customerPhone,
        address: data.shipping.address,
        city: data.shipping.city,
        country: data.shipping.country,
        postal_code: data.shipping.postalCode,
      })

      if (customer) {
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
          shipping_country: data.shipping.country,
          shipping_postal_code: data.shipping.postalCode,
          notes: `Conekta OXXO Order: ${result.id} | Reference: ${reference || "N/A"}`,
          items: validItems.map(item => {
            const product = productMap.get(item.id)
            return {
              product_id: item.id,
              product_name: product?.name || item.name,
              product_sku: item.sku || item.id,
              product_image: item.image || product?.main_image || null,
              quantity: item.quantity,
              unit_price: product?.price || item.price,
              total_price: (product?.price || item.price) * item.quantity,
              variant_size: item.size,
              variant_color: item.color,
            }
          }),
        })

        return {
          success: true,
          conektaOrderId: result.id,
          reference,
          barcodeUrl,
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          orderNumber: order?.order_number,
        }
      }
    } catch (orderError) {
      console.error("Error creating OXXO order in DB:", orderError)
    }

    return {
      success: true,
      conektaOrderId: result.id,
      reference,
      barcodeUrl,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    }
  } catch (err) {
    console.error("Conekta OXXO error:", err)
    return { error: "Connection error with payment processor" }
  }
}

// Create SPEI bank transfer order - returns a CLABE number for the customer to transfer to
export async function createConektaSpeiOrder(data: {
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  customerName: string
  shipping: ShippingData
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}) {
  try {
    const supabase = await createClient()

    const validItems = data.items.filter(item => isValidUUID(item.id))
    if (validItems.length === 0) {
      return { error: "Your cart contains outdated products. Please clear your cart and try again." }
    }

    const productIds = validItems.map(item => item.id)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status, main_image")
      .in("id", productIds)

    if (error || !products || products.length === 0) {
      return { error: "Error validating products" }
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of validItems) {
      const product = productMap.get(item.id)
      if (!product) return { error: `Product not found: ${item.name}` }
      if (product.status !== "active") return { error: `Product not available: ${item.name}` }
    }

    const lineItems = validItems.map(item => {
      const product = productMap.get(item.id)
      return {
        name: (product?.name || item.name).substring(0, 250),
        unit_price: product?.price || item.price,
        quantity: item.quantity,
        sku: item.sku || item.id,
        tags: ["atelier"],
      }
    })

    // Expire in 3 days
    const expiresAt = Math.round(Date.now() / 1000 + 60 * 60 * 24 * 3)

    const orderPayload = {
      currency: "MXN",
      customer_info: {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      },
      line_items: lineItems,
      charges: [{
        payment_method: {
          type: "spei",
          expires_at: expiresAt,
        },
      }],
      tax_lines: [{
        description: "IVA",
        amount: data.tax,
      }],
      shipping_lines: [{
        amount: data.shippingCost,
        carrier: data.shippingCost > 20000 ? "Express" : "Standard",
      }],
      shipping_contact: {
        receiver: data.customerName,
        phone: data.customerPhone,
        address: {
          street1: data.shipping.address,
          city: data.shipping.city,
          state: data.shipping.state || data.shipping.city,
          country: "mx",
          postal_code: data.shipping.postalCode,
          residential: true,
        },
      },
      metadata: {
        integration: "Atelier Web",
        source: "checkout",
        payment_type: "spei",
      },
    }

    const response = await fetch(`${CONEKTA_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.conekta-v2.1.0+json",
        "Content-Type": "application/json",
        "Authorization": getConektaAuthHeader(),
      },
      body: JSON.stringify(orderPayload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Conekta SPEI order error:", result)
      return { error: result.details?.[0]?.message || result.message || "Error creating SPEI payment" }
    }

    const charge = result.charges?.data?.[0]
    const clabe = charge?.payment_method?.receiving_account_number
    const bank = charge?.payment_method?.receiving_account_bank
    const reference = charge?.payment_method?.reference

    // Save order in DB as pending
    try {
      const customer = await getOrCreateCustomer(data.customerEmail, {
        name: data.customerName,
        phone: data.customerPhone,
        address: data.shipping.address,
        city: data.shipping.city,
        country: data.shipping.country,
        postal_code: data.shipping.postalCode,
      })

      if (customer) {
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
          shipping_country: data.shipping.country,
          shipping_postal_code: data.shipping.postalCode,
          notes: `Conekta SPEI Order: ${result.id} | CLABE: ${clabe || "N/A"} | Bank: ${bank || "N/A"}`,
          items: validItems.map(item => {
            const product = productMap.get(item.id)
            return {
              product_id: item.id,
              product_name: product?.name || item.name,
              product_sku: item.sku || item.id,
              product_image: item.image || product?.main_image || null,
              quantity: item.quantity,
              unit_price: product?.price || item.price,
              total_price: (product?.price || item.price) * item.quantity,
              variant_size: item.size,
              variant_color: item.color,
            }
          }),
        })

        return {
          success: true,
          conektaOrderId: result.id,
          clabe,
          bank,
          reference,
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          orderNumber: order?.order_number,
        }
      }
    } catch (orderError) {
      console.error("Error creating SPEI order in DB:", orderError)
    }

    return {
      success: true,
      conektaOrderId: result.id,
      clabe,
      bank,
      reference,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    }
  } catch (err) {
    console.error("Conekta SPEI error:", err)
    return { error: "Connection error with payment processor" }
  }
}

function getConektaErrorMessage(code: string | undefined): string {
  if (!code) return "Payment declined. Please try another card."

  const messages: Record<string, string> = {
    "insufficient_funds": "Insufficient funds",
    "card_declined": "Card declined",
    "expired_card": "Expired card",
    "suspected_fraud": "Transaction declined for security reasons",
    "invalid_number": "Invalid card number",
    "invalid_cvc": "Invalid security code",
    "processing_error": "Processing error. Please try again",
    "call_issuer": "Please contact your bank",
    "card_not_supported": "Card not supported",
    "do_not_honor": "Transaction declined by bank",
    "invalid_account": "Invalid account",
  }

  return messages[code] || "Payment declined. Please try another card."
}
