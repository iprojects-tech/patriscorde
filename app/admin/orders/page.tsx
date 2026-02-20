"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search,
  ChevronDown,
  Package,
  Eye,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAdminOrders } from "@/app/actions/admin"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"
import type { OrderStatus, PaymentStatus } from "@/lib/admin/types"

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Processing", className: "bg-purple-50 text-purple-700 border-purple-200" },
  shipped: { label: "Shipped", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  refunded: { label: "Refunded", className: "bg-gray-50 text-gray-700 border-gray-200" },
}

export default function OrdersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | null>(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      const ordersData = await getAdminOrders()
      setOrders(ordersData)
    }
    fetchOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !selectedStatus || order.status === selectedStatus
    const matchesPayment = !selectedPaymentStatus || order.paymentStatus === selectedPaymentStatus
    return matchesSearch && matchesStatus && matchesPayment
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Search orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 border-border bg-transparent">
              {selectedStatus 
                ? orderStatusConfig[selectedStatus].label 
                : "All Status"
              }
              <ChevronDown className="h-4 w-4 ml-2" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(Object.keys(orderStatusConfig) as OrderStatus[]).map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setSelectedStatus(status)}
              >
                {orderStatusConfig[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 border-border bg-transparent">
              {selectedPaymentStatus 
                ? paymentStatusConfig[selectedPaymentStatus].label 
                : "All Payments"
              }
              <ChevronDown className="h-4 w-4 ml-2" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setSelectedPaymentStatus(null)}>
              All Payments
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(Object.keys(paymentStatusConfig) as PaymentStatus[]).map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setSelectedPaymentStatus(status)}
              >
                {paymentStatusConfig[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders Table */}
      <div className="border border-border bg-background overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-[140px_1fr_120px_100px_100px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Order
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Customer
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Date
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Status
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Payment
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground text-right">
            Total
          </span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3, ease: premiumEasing }}
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="grid grid-cols-1 lg:grid-cols-[140px_1fr_120px_100px_100px_100px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors cursor-pointer"
            >
              {/* Order Number */}
              <div>
                <span className="text-sm font-medium font-mono">
                  {order.orderNumber}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5 lg:hidden">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Customer */}
              <div className="flex items-center justify-between lg:block">
                <div>
                  <p className="text-sm">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.customer.email}
                  </p>
                </div>
                <p className="text-sm font-medium lg:hidden">{formatPrice(order.total)}</p>
              </div>

              {/* Date - Desktop */}
              <div className="hidden lg:block">
                <span className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(order.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 lg:block">
                <span className="text-xs text-muted-foreground lg:hidden">Status:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${orderStatusConfig[order.status].className}`}
                >
                  {orderStatusConfig[order.status].label}
                </Badge>
              </div>

              {/* Payment */}
              <div className="flex items-center gap-2 lg:block">
                <span className="text-xs text-muted-foreground lg:hidden">Payment:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-medium ${paymentStatusConfig[order.paymentStatus].className}`}
                >
                  {paymentStatusConfig[order.paymentStatus].label}
                </Badge>
              </div>

              {/* Total - Desktop */}
              <div className="hidden lg:block text-right">
                <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/30" strokeWidth={1} />
            <p className="text-sm text-muted-foreground mt-4">No orders found</p>
          </div>
        )}
      </div>
    </div>
  )
}
