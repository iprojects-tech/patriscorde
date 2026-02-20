"use server"

import { createClient } from "@/lib/supabase/server"
import { createOrder } from "@/lib/db/orders"
import { getOrCreateCustomer } from "@/lib/db/customers"

const CLIP_API_URL = process.env.CLIP_API_URL || "https://api.payclip.com"
const CLIP_API_KEY = process.env.CLIP_API_KEY!
const CLIP_SECRET_KEY = process.env.CLIP_SECRET_KEY!
const CLIP_PUBLIC_KEY = process.env.NEXT_PUBLIC_CLIP_PUBLIC_KEY!

// Helper to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Generate Basic auth token from API Key and Secret
function getClipAuthToken(): string {
  const credentials = `${CLIP_API_KEY}:${CLIP_SECRET_KEY}`
  const token = Buffer.from(credentials).toString("base64")
  return token
}

// Get the public key for client-side SDK initialization
export async function getClipPublicKey() {
  return CLIP_PUBLIC_KEY || null
}

interface CartItem {
  id: string
  name: string
  sku?: string
  price: number // in cents (MXN)
  quantity: number
  image?: string
  size?: string
  color?: string
}

interface ShippingData {
  name: string
  address: string
  city: string
  country: string
  postalCode: string
}

interface ClipPaymentData {
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  cardToken: string // Token from Clip SDK
  shipping: ShippingData
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

interface ClipRedirectData {
  items: CartItem[]
  customerEmail: string
  customerPhone: string
  paymentMethod: "card" | "cash" | "transfer" | "all"
  successUrl: string
  cancelUrl: string
  shipping: ShippingData
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

// Process card payment using Clip Transparent Checkout
export async function processClipCardPayment(data: ClipPaymentData) {
  try {
    const supabase = await createClient()
    
    // Validate products exist and get current prices from database
    const productIds = data.items.map(item => item.id)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status")
      .in("id", productIds)
    
    if (error || !products) {
      return { error: "Error al validar los productos" }
    }
    
    // Create product map for price validation
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Calculate total with server-validated prices
    let totalAmount = 0
    const validatedItems: { name: string; price: number; quantity: number }[] = []
    
    for (const item of data.items) {
      const product = productMap.get(item.id)
      
      if (!product) {
        return { error: `Producto no encontrado: ${item.name}` }
      }
      
      if (product.status !== "active") {
        return { error: `Producto no disponible: ${item.name}` }
      }
      
      // Convert from cents to pesos for Clip (Clip uses decimal format)
      const priceInPesos = product.price / 100
      totalAmount += priceInPesos * item.quantity
      
      validatedItems.push({
        name: product.name,
        price: priceInPesos,
        quantity: item.quantity,
      })
    }
    
    // Build description
    const description = validatedItems
      .map(item => `${item.quantity}x ${item.name}`)
      .join(", ")
    
    // Call Clip Payments API
    const response = await fetch(`${CLIP_API_URL}/payments`, {
      method: "POST",
      headers: {
        "authorization": `Basic ${getClipAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: "MXN",
        description: description.substring(0, 250), // Clip has a limit
        payment_method: {
          token: data.cardToken,
        },
        customer: {
          email: data.customerEmail,
          phone: data.customerPhone || "",
        },
      }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error("Clip payment error:", result)
      return { 
        error: result.message || "Error al procesar el pago",
        code: result.status_detail?.code 
      }
    }
    
    // Check payment status
    if (result.status === "approved") {
      // Create customer and order in database
      try {
        const customer = await getOrCreateCustomer(data.customerEmail, {
          name: data.shipping.name,
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
            customer_name: data.shipping.name,
            subtotal: data.subtotal,
            shipping: data.shippingCost,
            tax: data.tax,
            total: data.total,
            shipping_address: data.shipping.address,
            shipping_city: data.shipping.city,
            shipping_country: data.shipping.country,
            shipping_postal_code: data.shipping.postalCode,
            notes: `Clip Payment ID: ${result.id}`,
            items: data.items.map(item => {
              const product = productMap.get(item.id)
              return {
                product_id: item.id,
                product_name: product?.name || item.name,
                product_sku: item.sku || item.id,
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
            paymentId: result.id,
            receiptNo: result.receipt_no,
            status: result.status,
            orderNumber: order?.order_number,
          }
        }
      } catch (orderError) {
        console.error("Error creating order:", orderError)
        // Payment succeeded but order creation failed - still return success
      }
      
      return { 
        success: true, 
        paymentId: result.id,
        receiptNo: result.receipt_no,
        status: result.status,
      }
    } else if (result.status === "pending") {
      // 3DS authentication required
      return {
        pending: true,
        paymentId: result.id,
        pendingAction: result.pending_action,
        status: result.status,
      }
    } else {
      return { 
        error: getClipErrorMessage(result.status_detail?.code),
        code: result.status_detail?.code,
      }
    }
  } catch (err) {
    console.error("Clip card payment error:", err)
    return { error: "Error de conexión con el procesador de pagos" }
  }
}

// Create redirect checkout for all payment methods
export async function createClipRedirectCheckout(data: ClipRedirectData) {
  try {
    const supabase = await createClient()
    
    // Filter out items with invalid UUIDs (old mock data)
    const validItems = data.items.filter(item => isValidUUID(item.id))
    const invalidItems = data.items.filter(item => !isValidUUID(item.id))
    
    // Log invalid items for debugging (old mock data in cart)
    if (invalidItems.length > 0) {
      console.warn("Cart contains invalid product IDs (old mock data):", invalidItems.map(i => i.id))
    }
    
    if (validItems.length === 0) {
      return { 
        error: "Your cart contains outdated products. Please clear your cart and add products again." 
      }
    }
    
    // Validate products exist and get current prices from database
    const productIds = validItems.map(item => item.id)
    
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status, main_image")
      .in("id", productIds)
    
    if (error) {
      console.error("Products query error:", error)
      return { error: "Error validating products: " + error.message }
    }
    
    if (!products || products.length === 0) {
      return { error: "Products not found in database. Please refresh and try again." }
    }
    
    // Create product map for price validation
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Validate all products exist and are active
    const validatedItems: { name: string; price: number; quantity: number }[] = []
    
    for (const item of validItems) {
      const product = productMap.get(item.id)
      
      if (!product) {
        return { error: `Product not found: ${item.name}` }
      }
      
      if (product.status !== "active") {
        return { error: `Product not available: ${item.name}` }
      }
      
      validatedItems.push({
        name: product.name,
        price: item.price / 100, // Use cart price for display
        quantity: item.quantity,
      })
    }
    
    // Use the total from checkout (already calculated and shown to user) - convert from centavos to pesos
    const totalAmount = data.total / 100
    
    // Build description
    const description = validatedItems
      .map(item => `${item.quantity}x ${item.name}`)
      .join(", ")
    
    // Determine payment methods based on selection
    let paymentMethods: string[]
    if (data.paymentMethod === "card") {
      paymentMethods = ["CARD"]
    } else if (data.paymentMethod === "cash") {
      paymentMethods = ["CASH"]
    } else if (data.paymentMethod === "transfer") {
      paymentMethods = ["BANK_TRANSFER"]
    } else {
      // "all" - allow all payment methods
      paymentMethods = ["CARD", "CASH", "BANK_TRANSFER"]
    }
    
    // Create Clip payment link (Checkout Redireccionado) - API v2
    const authToken = getClipAuthToken()
    const response = await fetch(`${CLIP_API_URL}/v2/checkout`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: "MXN",
        purchase_description: description.substring(0, 250),
        redirection_url: {
          success: data.successUrl,
          error: data.cancelUrl,
          default: data.successUrl,
        },
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/clip`,
        payment_methods: paymentMethods,
        metadata: {
          items: JSON.stringify(validItems.map(i => ({ 
            id: i.id, 
            name: i.name,
            sku: i.sku,
            qty: i.quantity, 
            size: i.size, 
            color: i.color,
            price: i.price,
          }))),
          shipping: JSON.stringify(data.shipping),
          subtotal: data.subtotal.toString(),
          shippingCost: data.shippingCost.toString(),
          tax: data.tax.toString(),
          total: data.total.toString(),
        },
        customer: {
          email: data.customerEmail,
          phone: data.customerPhone || "",
        },
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours for cash/transfer
      }),
    })
    
    const responseText = await response.text()
    let result: any
    
    try {
      result = JSON.parse(responseText)
    } catch {
      return { error: "Error del servidor de pagos" }
    }
    
    if (!response.ok) {
      console.error("Clip checkout error:", result)
      return { error: result.message || result.error || "Error al crear el enlace de pago" }
    }
    
    const paymentRequestId = result.id
    const checkoutUrl = result.payment_request_url || result.checkout_url || result.url
    
    // Create order with "pending" status BEFORE redirecting
    try {
      const customer = await getOrCreateCustomer(data.customerEmail, {
        name: data.shipping.name,
        phone: data.customerPhone,
        address: data.shipping.address,
        city: data.shipping.city,
        country: data.shipping.country,
        postal_code: data.shipping.postalCode,
      })
      
      if (customer) {
        const paymentMethodLabels: Record<string, string> = {
          card: "Card",
          cash: "Cash (OXXO/Convenience Store)", 
          transfer: "Bank Transfer (SPEI)",
          all: "Clip Checkout",
        }
        const paymentMethodLabel = paymentMethodLabels[data.paymentMethod] || "Clip Checkout"
        
        const order = await createOrder({
          customer_id: customer.id,
          customer_email: data.customerEmail,
          customer_name: data.shipping.name,
          status: "pending", // Pending until payment is confirmed
          subtotal: data.subtotal,
          shipping: data.shippingCost,
          tax: data.tax,
          total: data.total,
          shipping_address: data.shipping.address,
          shipping_city: data.shipping.city,
          shipping_country: data.shipping.country,
          shipping_postal_code: data.shipping.postalCode,
          notes: `Clip Payment Request: ${paymentRequestId} | Method: ${paymentMethodLabel}`,
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
          checkoutUrl: checkoutUrl,
          paymentRequestId: paymentRequestId,
          orderNumber: order?.order_number,
        }
      }
    } catch (orderError) {
      console.error("Error creating pending order:", orderError)
      // Continue anyway - order can be created via webhook
    }
    
    return { 
      checkoutUrl: checkoutUrl,
      paymentRequestId: paymentRequestId,
    }
  } catch (err) {
    console.error("Clip redirect checkout error:", err)
    return { error: "Error de conexión con el procesador de pagos" }
  }
}

// Get payment status
export async function getClipPaymentStatus(paymentId: string) {
  try {
    const response = await fetch(`${CLIP_API_URL}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "authorization": `Basic ${getClipAuthToken()}`,
        "Content-Type": "application/json",
      },
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return { error: "Error al obtener el estado del pago" }
    }
    
    return {
      status: result.status,
      statusDetail: result.status_detail,
      paymentId: result.id,
      receiptNo: result.receipt_no,
    }
  } catch (err) {
    console.error("Error getting payment status:", err)
    return { error: "Error de conexión" }
  }
}

// Helper function to translate Clip error codes
function getClipErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    "RE-BIN01": "Tarjeta rechazada",
    "RE-ISS01": "Fondos insuficientes",
    "RE-ISS02": "Transacción rechazada por el banco",
    "RE-ISS03": "Tarjeta restringida",
    "RE-ISS05": "Transacción no permitida",
    "RE-ISS06": "Tarjeta retenida",
    "RE-ISS07": "Tarjeta expirada",
    "RE-ISS08": "Excede límite de retiro",
    "RE-ISS09": "PIN inválido",
    "RE-ISS10": "Número de intentos de PIN excedido",
    "RE-ISS11": "Contacta a tu banco",
    "RE-ISS12": "Monto inválido",
    "RE-ISS16": "Número de tarjeta inválido",
    "RE-ISS17": "Comercio inválido",
    "RE-ISS18": "Transacción inválida",
    "RE-3DS01": "Autenticación 3DS fallida",
    "RE-ERI05": "Verificación KYC pendiente",
  }
  
  return errorMessages[code] || "Pago rechazado. Intenta con otra tarjeta."
}
