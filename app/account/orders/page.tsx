"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Package, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerAuth } from "@/store/customer-auth"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/db/types"
import { premiumEasing } from "@/lib/motion"

interface OrderItem {
  id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
  variant_size: string | null
  variant_color: string | null
  product?: {
    main_image: string | null
  }
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  subtotal: number
  shipping: number
  tax: number
  created_at: string
  shipping_address: string | null
  shipping_city: string | null
  shipping_country: string | null
  shipping_postal_code: string | null
  items?: OrderItem[]
}

export default function OrdersPage() {
  const { user } = useCustomerAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) return

      const supabase = createClient()
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items (
            *,
            product:products (main_image)
          )
        `)
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false })

      if (data) {
        setOrders(data)
      }
      setIsLoading(false)
    }

    fetchOrders()
  }, [user?.email])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-6">
        Order History
      </h2>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, ease: premiumEasing }}
              className="border border-border"
            >
              {/* Order Header */}
              <button
                type="button"
                onClick={() => toggleOrder(order.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      Order #{order.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 text-[10px] font-medium tracking-wider uppercase ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-medium">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedOrder === order.id ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                </div>
              </button>

              {/* Order Details */}
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: premiumEasing }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-border bg-muted/30">
                      {/* Items */}
                      <div className="space-y-4 mb-6">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="relative w-16 h-20 bg-muted flex-shrink-0">
                              {item.product?.main_image && (
                                <Image
                                  src={item.product.main_image || "/placeholder.svg"}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.product_sku}
                              </p>
                              {(item.variant_size || item.variant_color) && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.variant_size && `Size: ${item.variant_size}`}
                                  {item.variant_size && item.variant_color && " / "}
                                  {item.variant_color && `Color: ${item.variant_color}`}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                </span>
                                <span className="text-sm">
                                  {formatPrice(item.total_price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t border-border pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatPrice(order.shipping)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{formatPrice(order.tax)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t border-border">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Shipping Address
                          </p>
                          <p className="text-sm">
                            {typeof order.shipping_address === "object"
                              ? (order.shipping_address as any).address || JSON.stringify(order.shipping_address)
                              : order.shipping_address}
                            <br />
                            {typeof order.shipping_city === "object"
                              ? (order.shipping_city as any).city || ""
                              : order.shipping_city}
                            {order.shipping_postal_code && typeof order.shipping_postal_code !== "object"
                              ? `, ${order.shipping_postal_code}`
                              : ""}
                            <br />
                            {typeof order.shipping_country === "object"
                              ? (order.shipping_country as any).country || ""
                              : order.shipping_country}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <h3 className="font-medium mb-2">No orders yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            When you place an order, it will appear here
          </p>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
