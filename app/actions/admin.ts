"use server"

import { getProductsCount } from "@/lib/db/products"
import { getOrders, getOrdersCount, getOrdersRevenue } from "@/lib/db/orders"
import { getCustomersCount } from "@/lib/db/customers"
import { pgQuery } from "@/lib/postgres"

export async function getDashboardStats() {
  const [totalProducts, totalOrders, totalCustomers, totalRevenue, recentOrders, topProducts] = await Promise.all([
    getProductsCount(),
    getOrdersCount(),
    getCustomersCount(),
    getOrdersRevenue(),
    getOrders({ limit: 5 }),
    getTopProductsData(),
  ])

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

  const revenueChange = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0
  const ordersChange = lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0

  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    totalRevenue,
    revenueChange,
    ordersChange,
    customersChange: 0,
    recentOrders: recentOrders.map((order) => ({
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

async function getTopProductsData() {
  const result = await pgQuery<{
    product_id: string
    product_name: string
    product_image: string | null
    totalsold: string
    revenue: string
  }>(
    `SELECT
      product_id,
      product_name,
      product_image,
      SUM(quantity)::text AS totalsold,
      SUM(unit_price * quantity)::text AS revenue
     FROM public.order_items
     WHERE product_id IS NOT NULL
     GROUP BY product_id, product_name, product_image
     ORDER BY SUM(quantity) DESC
     LIMIT 10`,
  )

  return result.rows.map((p) => ({
    product: {
      id: p.product_id,
      name: p.product_name,
      main_image: p.product_image,
    },
    totalSold: Number(p.totalsold),
    revenue: Number(p.revenue),
  }))
}

async function getOrdersCountInRange(startDate: string, endDate?: string) {
  const values: unknown[] = [startDate]
  let sql = "SELECT COUNT(*)::text AS count FROM public.orders WHERE created_at >= $1"
  if (endDate) {
    values.push(endDate)
    sql += ` AND created_at <= $${values.length}`
  }

  const result = await pgQuery<{ count: string }>(sql, values)
  return Number(result.rows[0]?.count ?? 0)
}

export async function getAdminOrders(options?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const values: unknown[] = []
  const conditions: string[] = []

  if (options?.status) {
    values.push(options.status)
    conditions.push(`o.status = $${values.length}`)
  }
  if (options?.search) {
    values.push(`%${options.search}%`)
    conditions.push(`(o.order_number ILIKE $${values.length} OR o.customer_email ILIKE $${values.length} OR o.customer_name ILIKE $${values.length})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  values.push(limit, offset)

  const ordersResult = await pgQuery<any>(
    `SELECT o.* FROM public.orders o
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  )

  const orders = ordersResult.rows
  if (orders.length === 0) return []

  const ids = orders.map((o: any) => o.id)
  const itemsResult = await pgQuery<any>(
    `SELECT * FROM public.order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
    [ids],
  )
  const itemsByOrder = new Map<string, any[]>()
  for (const item of itemsResult.rows) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id)!.push(item)
  }

  return orders.map((order: any) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.status === "paid" ? "paid" : order.status === "cancelled" ? "failed" : "pending",
    total: order.total,
    createdAt: order.created_at,
    items: itemsByOrder.get(order.id) || [],
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
  const values: unknown[] = []
  const conditions: string[] = []

  if (options?.status) {
    values.push(options.status)
    conditions.push(`p.status = $${values.length}`)
  }
  if (options?.categoryId) {
    values.push(options.categoryId)
    conditions.push(`p.category_id = $${values.length}`)
  }
  if (options?.search) {
    values.push(`%${options.search}%`)
    conditions.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pgQuery<any>(
    `SELECT p.*, row_to_json(c) AS category
     FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     ${where}
     ORDER BY p.created_at DESC`,
    values,
  )
  return result.rows
}

export async function getAdminProductById(id: string) {
  const result = await pgQuery<any>(
    `SELECT p.*, row_to_json(c) AS category
     FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     WHERE p.id = $1
     LIMIT 1`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function updateAdminProduct(
  id: string,
  updates: {
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
  },
) {
  try {
    const result = await pgQuery<any>(
      `UPDATE public.products
       SET
        name = COALESCE($2, name),
        sku = COALESCE($3, sku),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        status = COALESCE($6, status),
        category_id = COALESCE($7, category_id),
        main_image = COALESCE($8, main_image),
        gallery = COALESCE($9, gallery),
        featured = COALESCE($10, featured),
        variants = COALESCE($11, variants),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        updates.name ?? null,
        updates.sku ?? null,
        updates.description ?? null,
        updates.price ?? null,
        updates.status ?? null,
        updates.category_id ?? null,
        updates.main_image ?? null,
        updates.gallery ?? null,
        updates.featured ?? null,
        updates.variants ? JSON.stringify(updates.variants) : null,
      ],
    )
    return { success: true, product: result.rows[0] }
  } catch (error: any) {
    console.error("Error updating product:", error)
    return { error: error.message }
  }
}

export async function deleteAdminProduct(id: string) {
  try {
    await pgQuery("DELETE FROM public.products WHERE id = $1", [id])
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return { error: error.message }
  }
}

export async function getAdminCategories() {
  const result = await pgQuery<any>("SELECT * FROM public.categories ORDER BY name ASC")
  return result.rows
}

export async function getRevenueChartData(period: "7days" | "months" | "years") {
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

  const result = await pgQuery<{ total: number; created_at: string }>(
    `SELECT total, created_at
     FROM public.orders
     WHERE created_at >= $1 AND status <> 'cancelled'
     ORDER BY created_at ASC`,
    [startDate.toISOString()],
  )

  const grouped: Record<string, number> = {}

  for (const order of result.rows) {
    const date = new Date(order.created_at)
    const key =
      groupBy === "day"
        ? date.toLocaleDateString("en-US", { weekday: "short" })
        : groupBy === "month"
        ? date.toLocaleDateString("en-US", { month: "short" })
        : date.getFullYear().toString()
    grouped[key] = (grouped[key] || 0) + Number(order.total)
  }

  return Object.entries(grouped).map(([label, revenue]) => ({ label, revenue }))
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const result = await pgQuery<any>(
      "UPDATE public.orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
      [orderId, status],
    )
    return { success: true, order: result.rows[0] }
  } catch (error: any) {
    console.error("Error updating order status:", error)
    return { error: error.message }
  }
}

export async function getOrderById(orderId: string) {
  const orderResult = await pgQuery<any>("SELECT * FROM public.orders WHERE id = $1 LIMIT 1", [orderId])
  const data = orderResult.rows[0]
  if (!data) return null

  const itemsResult = await pgQuery<any>("SELECT * FROM public.order_items WHERE order_id = $1", [orderId])
  const items = itemsResult.rows

  const productIds = items.filter((item: any) => item.product_id && !item.product_image).map((item: any) => item.product_id)
  let productImages: Record<string, string> = {}

  if (productIds.length > 0) {
    const productsResult = await pgQuery<{ id: string; main_image: string }>(
      "SELECT id, main_image FROM public.products WHERE id = ANY($1::uuid[])",
      [productIds],
    )
    productImages = Object.fromEntries(productsResult.rows.map((p) => [p.id, p.main_image]))
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
    items: items.map((item: any) => ({
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
    })),
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
