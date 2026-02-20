"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getOrderById } from "@/app/actions/admin"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"
import type { OrderStatus, PaymentStatus } from "@/lib/admin/types"

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Processing", className: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped: { label: "Shipped", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-50 text-gray-700 border-gray-200" },
}

const statusFlow: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const orderData = await getOrderById(orderId)
      setOrder(orderData)
      setIsLoading(false)
    }
    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Order not found</p>
        <Button asChild variant="outline" className="mt-4 bg-transparent">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const currentStatusIndex = statusFlow.indexOf(order.status)

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl tracking-tight font-mono">
              {order.orderNumber}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-medium ${orderStatusConfig[order.status].className}`}
            >
              {orderStatusConfig[order.status].label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* Status is automatically updated by payment webhooks */}
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: premiumEasing }}
          className="border border-border bg-background p-6"
        >
          <div className="flex items-center justify-between">
            {statusFlow.map((status, index) => {
              const isCompleted = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              
              return (
                <div key={status} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                        ${isCompleted 
                          ? "bg-foreground text-background" 
                          : "bg-muted text-muted-foreground"
                        }
                        ${isCurrent ? "ring-2 ring-foreground ring-offset-2" : ""}
                      `}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-2 ${isCompleted ? "font-medium" : "text-muted-foreground"}`}>
                      {orderStatusConfig[status].label}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${index < currentStatusIndex ? "bg-foreground" : "bg-muted"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: premiumEasing }}
          className="lg:col-span-2 border border-border bg-background"
        >
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                Order Items
              </h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item) => {
              const imageUrl = typeof item.product.main_image === "string"
                ? item.product.main_image
                : "/placeholder.jpg"
              
              return (
                <div key={item.id} className="p-5 flex gap-4">
                  <div className="relative w-16 h-20 bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.product.sku}
                    </p>
                    {(item.variant?.size || item.variant?.color) && (
                      <div className="flex items-center gap-2 mt-2">
                        {item.variant?.color && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 border border-border"
                              style={{ backgroundColor: item.variant.color.value }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.variant.color.name}
                            </span>
                          </div>
                        )}
                        {item.variant?.size && (
                          <span className="text-xs text-muted-foreground">
                            Size: {item.variant.size}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Order Summary */}
          <div className="p-5 border-t border-border bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: premiumEasing }}
            className="border border-border bg-background"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                  Customer
                </h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm font-medium">
                {order.customer.firstName} {order.customer.lastName}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                <span>{order.customer.email}</span>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                  <span>{order.customer.phone}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: premiumEasing }}
            className="border border-border bg-background"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                  Shipping Address
                </h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Truck className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">
                  {order.shippingMethod} Shipping
                </span>
              </div>
            </div>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: premiumEasing }}
            className="border border-border bg-background"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
                  Payment
                </h2>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${paymentStatusConfig[order.paymentStatus].className}`}
                >
                  {paymentStatusConfig[order.paymentStatus].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Last updated: {new Date(order.updatedAt).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {'Updated automatically via payment provider'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
