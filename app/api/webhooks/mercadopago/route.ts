import { NextRequest, NextResponse } from "next/server"
import { pgQuery } from "@/lib/postgres"

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com"
const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN

function mapPaymentStatus(status: string | null | undefined): "pending" | "paid" | "cancelled" | "refunded" {
  if (!status) return "pending"
  if (status === "approved") return "paid"
  if (status === "refunded" || status === "charged_back") return "refunded"
  if (["rejected", "cancelled"].includes(status)) return "cancelled"
  return "pending"
}

function extractPaymentId(req: NextRequest, body: any): string | null {
  const fromSearch = req.nextUrl.searchParams.get("data.id") || req.nextUrl.searchParams.get("id")
  if (fromSearch) return fromSearch

  const fromBody = body?.data?.id || body?.id
  if (fromBody) return String(fromBody)

  return null
}

export async function POST(req: NextRequest) {
  try {
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json({ error: "MERCADO_PAGO_ACCESS_TOKEN is not configured" }, { status: 500 })
    }

    const rawBody = await req.text()
    let body: any = null

    if (rawBody) {
      try {
        body = JSON.parse(rawBody)
      } catch {
        body = null
      }
    }

    const paymentId = extractPaymentId(req, body)
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    const paymentResponse = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    const payment = await paymentResponse.json()

    if (!paymentResponse.ok) {
      console.error("Mercado Pago payment lookup error:", payment)
      return NextResponse.json({ received: true })
    }

    const externalReference = payment.external_reference || payment.metadata?.order_id
    if (!externalReference) {
      return NextResponse.json({ received: true })
    }

    const existingOrderResult = await pgQuery<{ id: string; notes: string | null }>(
      "SELECT id, notes FROM public.orders WHERE id = $1 LIMIT 1",
      [externalReference],
    )
    const existingOrder = existingOrderResult.rows[0]

    if (!existingOrder) {
      return NextResponse.json({ received: true })
    }

    const normalizedStatus = mapPaymentStatus(payment.status)
    const currentNotes = existingOrder.notes || ""
    const nextNotes = `${currentNotes}${currentNotes ? " | " : ""}Mercado Pago Payment: ${payment.id} (${payment.status})`

    await pgQuery(
      `UPDATE public.orders
       SET status = $2, notes = $3, updated_at = NOW()
       WHERE id = $1`,
      [existingOrder.id, normalizedStatus, nextNotes],
    )

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Mercado Pago webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
