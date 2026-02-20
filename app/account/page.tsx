"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Package, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCustomerAuth } from "@/store/customer-auth"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/db/types"
import { premiumEasing } from "@/lib/motion"

interface RecentOrder {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
}

export default function AccountPage() {
  const { user } = useCustomerAuth()
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentOrders() {
      if (!user?.email) return

      const supabase = createClient()
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false })
        .limit(3)

      if (data) {
        setRecentOrders(data)
      }
      setIsLoading(false)
    }

    fetchRecentOrders()
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

  return (
    <div className="space-y-10">
      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/account/orders"
            className="group p-6 border border-border hover:border-foreground transition-colors"
          >
            <Package className="h-6 w-6 mb-4" strokeWidth={1.5} />
            <h3 className="font-medium mb-1">Order History</h3>
            <p className="text-sm text-muted-foreground">
              View and track your orders
            </p>
          </Link>
          <Link
            href="/account/settings"
            className="group p-6 border border-border hover:border-foreground transition-colors"
          >
            <svg
              className="h-6 w-6 mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="font-medium mb-1">Account Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update your profile and password
            </p>
          </Link>
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
            Recent Orders
          </h2>
          {recentOrders.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link href="/account/orders">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, ease: premiumEasing }}
                className="p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Order #{order.order_number}
                  </span>
                  <span
                    className={`px-2 py-1 text-[10px] font-medium tracking-wider uppercase ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Account Info */}
      <section>
        <h2 className="text-sm font-medium tracking-[0.1em] uppercase mb-6">
          Account Details
        </h2>
        <div className="p-6 border border-border space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-sm">{user?.email}</p>
          </div>
          {user?.name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Name
              </p>
              <p className="text-sm">{user.name}</p>
            </div>
          )}
          {user?.phone && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Phone
              </p>
              <p className="text-sm">{user.phone}</p>
            </div>
          )}
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <Link href="/account/settings">Edit Details</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
