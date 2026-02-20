import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Conekta webhook handler
// Events: order.paid, order.pending_payment, order.expired, charge.paid, charge.refunded
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log("Conekta webhook received:", JSON.stringify(body, null, 2))

    const eventType = body.type
    const data = body.data?.object

    if (!data) {
      return NextResponse.json({ received: true })
    }

    const supabase = await createClient()

    if (eventType === "order.paid" || eventType === "charge.paid") {
      const conektaOrderId = data.id || data.order_id

      if (conektaOrderId) {
        // Find order by Conekta Order ID in notes
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id, status")
          .ilike("notes", `%Conekta Order: ${conektaOrderId}%`)
          .single()

        if (existingOrder && existingOrder.status !== "paid") {
          await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id)

          console.log(`Order ${existingOrder.id} updated to paid via webhook`)
        }
      }
    } else if (
      eventType === "order.expired" ||
      eventType === "order.cancelled" ||
      eventType === "charge.refunded"
    ) {
      const conektaOrderId = data.id || data.order_id

      if (conektaOrderId) {
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id")
          .ilike("notes", `%Conekta Order: ${conektaOrderId}%`)
          .single()

        if (existingOrder) {
          const newStatus = eventType === "charge.refunded" ? "refunded" : "cancelled"
          await supabase
            .from("orders")
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingOrder.id)

          console.log(`Order ${existingOrder.id} updated to ${newStatus} via webhook`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Conekta webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
