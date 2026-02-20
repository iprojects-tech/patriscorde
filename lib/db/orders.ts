import { createClient } from "@/lib/supabase/server"
import type { Order, OrderItem } from "./types"

export async function getOrders(options?: {
  status?: Order["status"]
  customerId?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("orders")
    .select("*, customer:customers(*), items:order_items(*)")
    .order("created_at", { ascending: false })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  if (options?.customerId) {
    query = query.eq("customer_id", options.customerId)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }
  
  return data as Order[]
}

export async function getOrderById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .select("*, customer:customers(*), items:order_items(*)")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching order:", error)
    return null
  }
  
  return data as Order
}

export async function getOrderByNumber(orderNumber: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .select("*, customer:customers(*), items:order_items(*)")
    .eq("order_number", orderNumber)
    .single()
  
  if (error) {
    console.error("Error fetching order by number:", error)
    return null
  }
  
  return data as Order
}

export async function getMostRecentOrder() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .select("order_number, status, created_at, notes")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error("Error fetching most recent order:", error)
    return null
  }
  
  return data
}

export async function createOrder(order: {
  customer_email: string
  customer_name?: string
  customer_id?: string
  status?: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  shipping_address?: string
  shipping_city?: string
  shipping_country?: string
  shipping_postal_code?: string
  notes?: string
  stripe_payment_intent_id?: string
  items: Array<{
    product_id: string
    product_name: string
    product_sku: string
    product_image?: string
    quantity: number
    unit_price: number
    total_price: number
    variant_size?: string
    variant_color?: string
  }>
}) {
  const supabase = await createClient()
  
  // Generate order number
  const orderNumber = `ATL-${Date.now().toString(36).toUpperCase()}`
  
  // Build shipping address as JSONB
  const shippingAddressJson = order.shipping_address ? {
    address: order.shipping_address,
    city: order.shipping_city || "",
    country: order.shipping_country || "",
    postal_code: order.shipping_postal_code || "",
  } : null
  
  // Create order
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: order.customer_id,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      status: order.status || "pending",
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shipping_address: shippingAddressJson,
      notes: order.notes,
      stripe_payment_intent_id: order.stripe_payment_intent_id,
    })
    .select()
    .single()
  
  if (orderError) {
    console.error("Error creating order:", orderError)
    return null
  }
  
  // Create order items
  const itemsWithOrderId = order.items.map(item => ({
    ...item,
    order_id: orderData.id,
  }))
  
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithOrderId)
  
  if (itemsError) {
    console.error("Error creating order items:", itemsError)
    // Rollback order
    await supabase.from("orders").delete().eq("id", orderData.id)
    return null
  }
  
  return { ...orderData, items: itemsWithOrderId } as Order
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating order status:", error)
    return null
  }
  
  return data as Order
}

export async function getOrdersCount(options?: {
  status?: Order["status"]
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  
  const { count, error } = await query
  
  if (error) {
    console.error("Error counting orders:", error)
    return 0
  }
  
  return count || 0
}

export async function getOrdersRevenue(options?: {
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("orders")
    .select("total")
    .neq("status", "cancelled")
  
  if (options?.startDate) {
    query = query.gte("created_at", options.startDate)
  }
  if (options?.endDate) {
    query = query.lte("created_at", options.endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error calculating revenue:", error)
    return 0
  }
  
  return data.reduce((sum, order) => sum + order.total, 0)
}
