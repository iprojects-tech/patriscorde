import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/session"
import { pgQuery } from "@/lib/postgres"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "customer") {
    return NextResponse.json({ cart: [] })
  }

  const result = await pgQuery<{ cart_data: unknown }>(
    "SELECT cart_data FROM public.saved_carts WHERE auth_user_id = $1 LIMIT 1",
    [session.userId],
  )

  return NextResponse.json({ cart: (result.rows[0]?.cart_data as unknown[]) || [] })
}

export async function PUT(request: Request) {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "customer") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const cartData = body?.cart ?? []

  await pgQuery(
    `INSERT INTO public.saved_carts (auth_user_id, cart_data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (auth_user_id)
     DO UPDATE SET cart_data = EXCLUDED.cart_data, updated_at = NOW()`,
    [session.userId, JSON.stringify(cartData)],
  )

  return NextResponse.json({ success: true })
}
