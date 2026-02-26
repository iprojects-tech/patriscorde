import { pgPool, pgQuery } from "@/lib/postgres"
import type { Order, OrderItem } from "./types"

type DbOrder = Order & {
  shipping_address: any
}

async function hydrateOrder(order: DbOrder) {
  const [customerResult, itemsResult] = await Promise.all([
    order.customer_id
      ? pgQuery("SELECT * FROM public.customers WHERE id = $1 LIMIT 1", [order.customer_id])
      : Promise.resolve({ rows: [] } as any),
    pgQuery<OrderItem[] & any>("SELECT * FROM public.order_items WHERE order_id = $1 ORDER BY created_at ASC", [order.id]),
  ])

  return {
    ...order,
    customer: customerResult.rows[0] ?? undefined,
    items: itemsResult.rows as unknown as OrderItem[],
  } as Order
}

export async function getOrders(options?: {
  status?: Order["status"]
  customerId?: string
  limit?: number
  offset?: number
}) {
  const values: unknown[] = []
  const conditions: string[] = []

  if (options?.status) {
    values.push(options.status)
    conditions.push(`status = $${values.length}`)
  }
  if (options?.customerId) {
    values.push(options.customerId)
    conditions.push(`customer_id = $${values.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  values.push(limit, offset)

  const result = await pgQuery<DbOrder>(
    `SELECT * FROM public.orders
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values,
  )

  return Promise.all(result.rows.map(hydrateOrder))
}

export async function getOrderById(id: string) {
  const result = await pgQuery<DbOrder>("SELECT * FROM public.orders WHERE id = $1 LIMIT 1", [id])
  const row = result.rows[0]
  if (!row) return null
  return hydrateOrder(row)
}

export async function getOrderByNumber(orderNumber: string) {
  const result = await pgQuery<DbOrder>("SELECT * FROM public.orders WHERE order_number = $1 LIMIT 1", [orderNumber])
  const row = result.rows[0]
  if (!row) return null
  return hydrateOrder(row)
}

export async function getMostRecentOrder() {
  const result = await pgQuery<{ order_number: string; status: string; created_at: string; notes: string | null }>(
    "SELECT order_number, status, created_at, notes FROM public.orders ORDER BY created_at DESC LIMIT 1",
  )
  return result.rows[0] ?? null
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
  shipping_state?: string
  shipping_neighborhood?: string
  shipping_country?: string
  shipping_postal_code?: string
  notes?: string
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
  const client = await pgPool.connect()
  try {
    await client.query("BEGIN")

    const orderNumber = `ATL-${Date.now().toString(36).toUpperCase()}`
    const shippingAddressJson = order.shipping_address
      ? {
          address: order.shipping_address,
          city: order.shipping_city || "",
          state: order.shipping_state || "",
          neighborhood: order.shipping_neighborhood || "",
          country: order.shipping_country || "",
          postal_code: order.shipping_postal_code || "",
        }
      : null

    const orderResult = await client.query<DbOrder>(
      `INSERT INTO public.orders
        (order_number, customer_id, customer_email, customer_name, status, subtotal, shipping, tax, total, shipping_address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        orderNumber,
        order.customer_id ?? null,
        order.customer_email,
        order.customer_name ?? null,
        order.status || "pending",
        order.subtotal,
        order.shipping,
        order.tax,
        order.total,
        shippingAddressJson ? JSON.stringify(shippingAddressJson) : null,
        order.notes ?? null,
      ],
    )

    const insertedOrder = orderResult.rows[0]
    if (!insertedOrder) {
      await client.query("ROLLBACK")
      return null
    }

    for (const item of order.items) {
      await client.query(
        `INSERT INTO public.order_items
          (order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price, variant_size, variant_color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          insertedOrder.id,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.product_image ?? null,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.variant_size ?? null,
          item.variant_color ?? null,
        ],
      )
    }

    await client.query("COMMIT")
    return getOrderById(insertedOrder.id)
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating order:", error)
    return null
  } finally {
    client.release()
  }
}

export async function updateOrderStatus(id: string, status: Order["status"]) {
  const result = await pgQuery<Order>(
    "UPDATE public.orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
    [id, status],
  )
  return result.rows[0] ?? null
}

export async function updateOrderMetadata(id: string, updates: { status?: string; notes?: string }) {
  const result = await pgQuery<Order>(
    `UPDATE public.orders
     SET
      status = COALESCE($2, status),
      notes = COALESCE($3, notes),
      updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, updates.status ?? null, updates.notes ?? null],
  )
  return result.rows[0] ?? null
}

export async function getOrdersCount(options?: {
  status?: Order["status"]
}) {
  const values: unknown[] = []
  let where = ""
  if (options?.status) {
    values.push(options.status)
    where = `WHERE status = $${values.length}`
  }
  const result = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM public.orders ${where}`, values)
  return Number(result.rows[0]?.count ?? 0)
}

export async function getOrdersRevenue(options?: {
  startDate?: string
  endDate?: string
}) {
  const values: unknown[] = []
  const conditions = ["status <> 'cancelled'"]

  if (options?.startDate) {
    values.push(options.startDate)
    conditions.push(`created_at >= $${values.length}`)
  }
  if (options?.endDate) {
    values.push(options.endDate)
    conditions.push(`created_at <= $${values.length}`)
  }

  const result = await pgQuery<{ total: string }>(
    `SELECT COALESCE(SUM(total), 0)::text AS total
     FROM public.orders
     WHERE ${conditions.join(" AND ")}`,
    values,
  )
  return Number(result.rows[0]?.total ?? 0)
}
