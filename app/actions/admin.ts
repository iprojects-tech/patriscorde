"use server"

import { getProducts, getProductsCount } from "@/lib/db/products"
import { getOrders, getOrdersCount, getOrdersRevenue } from "@/lib/db/orders"
import { getCustomersCount } from "@/lib/db/customers"
import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const [
    totalProducts,
    totalOrders,
    totalCustomers,
    totalRevenue,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    getProductsCount(),
    getOrdersCount(),
    getCustomersCount(),
    getOrdersRevenue(),
    getOrders({ limit: 5 }),
    getTopProductsData(),
  ])

  // Get last month's stats for comparison
  const lastMonthStart = new Date()
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  lastMonthStart.setDate(1)
  const lastMonthEnd = new Date()
  lastMonthEnd.setDate(0)

  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)

  const [lastMonthRevenue, lastMonthOrders] = await Promise.all([
    getOrdersRevenue({
      startDate: lastMonthStart.toISOString(),
      endDate: lastMonthEnd.toISOString(),
    }),
    getOrdersCountInRange(lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
  ])

  const [thisMonthRevenue, thisMonthOrders] = await Promise.all([
    getOrdersRevenue({ startDate: thisMonthStart.toISOString() }),
    getOrdersCountInRange(thisMonthStart.toISOString()),
  ])

  const revenueChange = lastMonthRevenue > 0 
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
    : 0

  const ordersChange = lastMonthOrders > 0 
    ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) 
    : 0

  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    totalRevenue,
    revenueChange,
    ordersChange,
    customersChange: 0, // Could implement if tracking new customers per month
    recentOrders: recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      customer: {
        firstName: order.customer_name?.split(" ")[0] || "Guest",
        lastName: order.customer_name?.split(" ").slice(1).join(" ") || "",
        email: order.customer_email,
      },
    })),
    topProducts,
  }
}

// Get top selling products based on order_items
async function getTopProductsData() {
  const supabase = await createClient()
  
  // Get all order items with product info, grouped by product
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, product_image, quantity, unit_price")
  
  if (error) {
    console.error("Error fetching top products:", error)
    return []
  }
  
  // Aggregate sales by product
  const productSales: Record<string, {
    productId: string
    name: string
    image: string | null
    totalSold: number
    revenue: number
  }> = {}
  
  for (const item of data) {
    if (!item.product_id) continue
    
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = {
        productId: item.product_id,
        name: item.product_name,
        image: item.product_image,
        totalSold: 0,
        revenue: 0,
      }
    }
    
    productSales[item.product_id].totalSold += item.quantity
    productSales[item.product_id].revenue += item.unit_price * item.quantity
  }
  
  // Sort by total sold and return top 10
  return Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10)
    .map(p => ({
      product: {
        id: p.productId,
        name: p.name,
        main_image: p.image,
      },
      totalSold: p.totalSold,
      revenue: p.revenue,
    }))
}

async function getOrdersCountInRange(startDate: string, endDate?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate)
  
  if (endDate) {
    query = query.lte("created_at", endDate)
  }
  
  const { count, error } = await query
  
  if (error) {
    console.error("Error counting orders in range:", error)
    return 0
  }
  
  return count || 0
}

export async function getAdminOrders(options?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  
  if (options?.search) {
    query = query.or(`order_number.ilike.%${options.search}%,customer_email.ilike.%${options.search}%,customer_name.ilike.%${options.search}%`)
  }
  
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching admin orders:", error)
    return []
  }
  
  return data.map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.status === "paid" ? "paid" : order.status === "cancelled" ? "failed" : "pending",
    total: order.total,
    createdAt: order.created_at,
    items: order.items || [],
    customer: {
      firstName: order.customer_name?.split(" ")[0] || "Guest",
      lastName: order.customer_name?.split(" ").slice(1).join(" ") || "",
      email: order.customer_email,
    },
  }))
}

export async function getAdminProducts(options?: {
  status?: string
  categoryId?: string
  search?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("products")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  
  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId)
  }
  
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching admin products:", error)
    return []
  }
  
  return data
}

export async function getAdminProductById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching product:", error)
    return null
  }
  
  return data
}

export async function updateAdminProduct(id: string, updates: {
  name?: string
  sku?: string
  description?: string
  price?: number
  status?: string
  category_id?: string | null
  main_image?: string | null
  gallery?: string[] | null
  featured?: boolean
  variants?: { sizes?: string[]; colors?: { name: string; value: string }[] } | null
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating product:", error)
    return { error: error.message }
  }
  
  return { success: true, product: data }
}

export async function deleteAdminProduct(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting product:", error)
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getAdminCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })
  
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  
  return data
}

export async function getRevenueChartData(period: "7days" | "months" | "years") {
  const supabase = await createClient()
  
  const now = new Date()
  let startDate: Date
  let groupBy: "day" | "month" | "year"
  
  if (period === "7days") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    groupBy = "day"
  } else if (period === "months") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    groupBy = "month"
  } else {
    startDate = new Date(now.getFullYear() - 4, 0, 1)
    groupBy = "year"
  }
  
  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at")
    .gte("created_at", startDate.toISOString())
    .neq("status", "cancelled")
    .order("created_at", { ascending: true })
  
  if (error) {
    console.error("Error fetching revenue data:", error)
    return []
  }
  
  // Group data by period
  const grouped: Record<string, number> = {}
  
  for (const order of data) {
    const date = new Date(order.created_at)
    let key: string
    
    if (groupBy === "day") {
      key = date.toLocaleDateString("en-US", { weekday: "short" })
    } else if (groupBy === "month") {
      key = date.toLocaleDateString("en-US", { month: "short" })
    } else {
      key = date.getFullYear().toString()
    }
    
    grouped[key] = (grouped[key] || 0) + order.total
  }
  
  // Convert to array format for chart
  return Object.entries(grouped).map(([label, revenue]) => ({
    label,
    revenue,
  }))
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating order status:", error)
    return { error: error.message }
  }
  
  return { success: true, order: data }
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .single()
  
  if (error) {
    console.error("Error fetching order:", error)
    return null
  }
  
  // Get product images for items that don't have them stored
  const productIds = data.items?.filter((item: any) => item.product_id && !item.product_image).map((item: any) => item.product_id) || []
  let productImages: Record<string, string> = {}
  
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, main_image")
      .in("id", productIds)
    
    if (products) {
      productImages = Object.fromEntries(products.map(p => [p.id, p.main_image]))
    }
  }
  
  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status,
    paymentStatus: data.status === "paid" || data.status === "confirmed" ? "paid" : data.status === "cancelled" ? "failed" : "pending",
    total: data.total,
    subtotal: data.subtotal,
    shipping: data.shipping,
    tax: data.tax,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    items: data.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.unit_price,
      product: {
        id: item.product_id,
        name: item.product_name,
        sku: item.product_sku,
        main_image: item.product_image || productImages[item.product_id] || null,
      },
      variant: {
        size: item.variant_size,
        color: item.variant_color ? { name: item.variant_color, value: item.variant_color } : null,
      },
    })) || [],
    customer: {
      firstName: data.customer_name?.split(" ")[0] || "Guest",
      lastName: data.customer_name?.split(" ").slice(1).join(" ") || "",
      email: data.customer_email,
      phone: null,
    },
    shippingAddress: data.shipping_address || {
      address: "",
      city: "",
      postalCode: "",
      country: "",
    },
    shippingMethod: "Standard",
  }
}
