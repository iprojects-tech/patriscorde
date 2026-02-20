"use server"

import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

interface CartItem {
  id: string
  name: string
  price: number // in cents
  quantity: number
  image?: string
  size?: string
  color?: string
}

interface CheckoutData {
  items: CartItem[]
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(data: CheckoutData) {
  try {
    const supabase = await createClient()
    
    // Validate products exist and get current prices from database
    const productIds = data.items.map(item => item.id)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, status")
      .in("id", productIds)
    
    if (error || !products) {
      return { error: "Failed to validate products" }
    }
    
    // Create product map for price validation
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // Build line items with server-validated prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    
    for (const item of data.items) {
      const product = productMap.get(item.id)
      
      if (!product) {
        return { error: `Product not found: ${item.name}` }
      }
      
      if (product.status !== "active") {
        return { error: `Product unavailable: ${item.name}` }
      }
      
      // Build description with variant info
      const descriptionParts: string[] = []
      if (item.size) descriptionParts.push(`Size: ${item.size}`)
      if (item.color) descriptionParts.push(`Color: ${item.color}`)
      
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: product.name,
            description: descriptionParts.length > 0 ? descriptionParts.join(", ") : undefined,
          },
          unit_amount: product.price, // Use server price, not client price
        },
        quantity: item.quantity,
      })
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      customer_email: data.customerEmail,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH"],
      },
      billing_address_collection: "required",
      metadata: {
        items: JSON.stringify(data.items.map(i => ({ id: i.id, qty: i.quantity, size: i.size, color: i.color }))),
      },
    })
    
    return { sessionId: session.id, url: session.url }
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return { error: "Failed to create checkout session" }
  }
}

export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    })
    
    return { session }
  } catch (err) {
    console.error("Error retrieving session:", err)
    return { error: "Failed to retrieve session" }
  }
}
