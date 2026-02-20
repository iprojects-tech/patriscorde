"use server"

import { getMostRecentOrder } from "@/lib/db/orders"

export async function getLatestOrderInfo() {
  try {
    const order = await getMostRecentOrder()
    
    if (!order) {
      return { orderNumber: null, status: null }
    }
    
    // Extract payment method from notes if available
    let paymentMethod: string | null = null
    if (order.notes) {
      if (order.notes.includes("Cash")) {
        paymentMethod = "cash"
      } else if (order.notes.includes("Bank Transfer") || order.notes.includes("SPEI")) {
        paymentMethod = "transfer"
      } else if (order.notes.includes("Card")) {
        paymentMethod = "card"
      }
    }
    
    return {
      orderNumber: order.order_number,
      status: order.status,
      paymentMethod,
    }
  } catch (error) {
    console.error("Error getting latest order:", error)
    return { orderNumber: null, status: null }
  }
}
