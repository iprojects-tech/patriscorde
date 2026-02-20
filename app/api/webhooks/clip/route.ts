import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createOrder } from "@/lib/db/orders"
import { getOrCreateCustomer } from "@/lib/db/customers"

// Clip webhook handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    console.log("Clip webhook received:", JSON.stringify(body, null, 2))
    
    const {
      id,
      payment_request_id,
      transaction_id,
      resource_status,
      resource_type,
      metadata,
      customer,
    } = body
    
    // Verify this is a payment notification
    if (resource_type !== "payment" && resource_type !== "checkout") {
      return NextResponse.json({ received: true })
    }
    
    const supabase = await createClient()
    
    // Update order status based on payment status
    if (resource_status === "approved" || resource_status === "paid") {
      // Find existing order by payment request ID (order was created with pending status)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, status")
        .ilike("notes", `%Clip Payment Request: ${payment_request_id}%`)
        .single()
      
      if (existingOrder) {
        // Update existing order to paid
        await supabase
          .from("orders")
          .update({ 
            status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id)
        
        console.log(`Order ${existingOrder.id} updated to paid status`)
      } else if (metadata) {
        // Fallback: Create order from metadata if it doesn't exist (shouldn't happen normally)
        try {
          const items = JSON.parse(metadata.items || "[]")
          const shipping = JSON.parse(metadata.shipping || "{}")
          const subtotal = parseInt(metadata.subtotal || "0")
          const shippingCost = parseInt(metadata.shippingCost || "0")
          const tax = parseInt(metadata.tax || "0")
          const total = parseInt(metadata.total || "0")
          
          const customerData = await getOrCreateCustomer(customer?.email || "", {
            name: shipping.name,
            phone: customer?.phone,
            address: shipping.address,
            city: shipping.city,
            country: shipping.country,
            postal_code: shipping.postalCode,
          })
          
          if (customerData) {
            await createOrder({
              customer_id: customerData.id,
              customer_email: customer?.email || "",
              customer_name: shipping.name,
              status: "paid", // Already paid
              subtotal,
              shipping: shippingCost,
              tax,
              total,
              shipping_address: shipping.address,
              shipping_city: shipping.city,
              shipping_country: shipping.country,
              shipping_postal_code: shipping.postalCode,
              notes: `Clip Payment Request: ${payment_request_id}`,
              items: items.map((item: any) => ({
                product_id: item.id,
                product_name: item.name,
                product_sku: item.sku || item.id,
                quantity: item.qty,
                unit_price: item.price,
                total_price: item.price * item.qty,
                variant_size: item.size,
                variant_color: item.color,
              })),
            })
          }
        } catch (parseError) {
          console.error("Error parsing webhook metadata:", parseError)
        }
      }
    } else if (resource_status === "rejected" || resource_status === "cancelled" || resource_status === "expired") {
      // Payment failed or expired - update order status
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .ilike("notes", `%Clip Payment Request: ${payment_request_id}%`)
        .single()
      
      if (existingOrder) {
        await supabase
          .from("orders")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id)
        
        console.log(`Order ${existingOrder.id} cancelled due to ${resource_status}`)
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Clip webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// Clip might send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: "ok" })
}
