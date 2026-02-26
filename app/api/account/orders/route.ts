import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/session"
import { pgQuery } from "@/lib/postgres"

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "customer") {
    return NextResponse.json({ orders: [] }, { status: 200 })
  }

  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : null

  const values: unknown[] = [session.email]
  let sql = `
    SELECT *
    FROM public.orders
    WHERE customer_email = $1
    ORDER BY created_at DESC
  `

  if (limit && Number.isFinite(limit) && limit > 0) {
    values.push(limit)
    sql += ` LIMIT $${values.length}`
  }

  const ordersResult = await pgQuery<any>(sql, values)
  const orders = ordersResult.rows

  if (orders.length === 0) return NextResponse.json({ orders: [] })

  const orderIds = orders.map((order) => order.id)
  const itemsResult = await pgQuery<any>(
    `SELECT
      oi.*,
      p.main_image AS product_main_image
     FROM public.order_items oi
     LEFT JOIN public.products p ON p.id = oi.product_id
     WHERE oi.order_id = ANY($1::uuid[])
     ORDER BY oi.created_at ASC`,
    [orderIds],
  )

  const byOrder = new Map<string, any[]>()
  for (const item of itemsResult.rows) {
    if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, [])
    byOrder.get(item.order_id)!.push({
      id: item.id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      variant_size: item.variant_size,
      variant_color: item.variant_color,
      product: {
        main_image: item.product_main_image,
      },
    })
  }

  return NextResponse.json({
    orders: orders.map((order) => ({
      ...order,
      items: byOrder.get(order.id) || [],
    })),
  })
}
