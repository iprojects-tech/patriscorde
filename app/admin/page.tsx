"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  X,
  Loader2,
} from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useAdminAuth } from "@/store/admin-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getDashboardStats, getRevenueChartData } from "@/app/actions/admin"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"
import type { OrderStatus } from "@/lib/admin/types"

type ChartPeriod = "7days" | "months" | "years"

const AdminDashboard = () => {
  const { user } = useAdminAuth()
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7days")
  const [isTopProductsOpen, setIsTopProductsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({ 
    totalRevenue: 0, 
    totalOrders: 0, 
    totalCustomers: 0, 
    totalProducts: 0, 
    recentOrders: [], 
    topProducts: [] 
  })
  const [revenueChartData, setRevenueChartData] = useState<any>({ "7days": [], "months": [], "years": [] })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, days7Data, monthsData, yearsData] = await Promise.all([
          getDashboardStats(),
          getRevenueChartData("7days"),
          getRevenueChartData("months"),
          getRevenueChartData("years"),
        ])
        setStats({
          ...statsData,
          recentOrders: statsData?.recentOrders || [],
          topProducts: statsData?.topProducts || [],
        })
        setRevenueChartData({
          "7days": days7Data || [],
          "months": monthsData || [],
          "years": yearsData || [],
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: stats.totalOrders.toString(),
      change: stats.ordersChange,
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      value: stats.totalCustomers.toString(),
      change: stats.customersChange,
      icon: Users,
    },
    {
      label: "Products",
      value: stats.totalProducts.toString(),
      change: 0,
      icon: Package,
    },
  ]

  const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
    confirmed: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
    processing: { label: "Processing", className: "bg-purple-50 text-purple-700 border-purple-200" },
    shipped: { label: "Shipped", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    delivered: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  }

  const periodLabels: Record<ChartPeriod, string> = {
    "7days": "Last 7 days",
    "months": "Last 12 months",
    "years": "All time",
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const recentOrders = stats?.recentOrders || []
  const topProducts = stats?.topProducts || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl tracking-tight">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: premiumEasing }}
            className="p-6 border border-border bg-background"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-serif mt-2">{stat.value}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-muted">
                <stat.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            {stat.change !== 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                {stat.change > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                )}
                <span className={`text-xs font-medium ${stat.change > 0 ? "text-green-600" : "text-red-600"}`}>
                  {stat.change > 0 ? "+" : ""}{stat.change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: premiumEasing }}
        className="border border-border bg-background"
      >
        <div className="p-5 flex items-center justify-between border-b border-border">
          <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
            Revenue Overview
          </h2>
          <div className="flex items-center gap-1 p-1 bg-muted">
            {(Object.keys(periodLabels) as ChartPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartPeriod === period
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueChartData[chartPeriod]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--background))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 0,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatPrice(value), "Revenue"]}
              />
              <Line 
                type="linear"
                dataKey="revenue" 
                stroke="#171717" 
                strokeWidth={2}
                dot={{ fill: "#171717", stroke: "#171717", r: 4 }}
                activeDot={{ fill: "#171717", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: premiumEasing }}
          className="lg:col-span-2 border border-border bg-background"
        >
          <div className="p-5 flex items-center justify-between border-b border-border">
            <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
              Recent Orders
            </h2>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link href="/admin/orders">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium font-mono">
                      {order.orderNumber}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-medium ${statusConfig[order.status].className}`}
                    >
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: premiumEasing }}
          className="border border-border bg-background"
        >
          <div className="p-5 flex items-center justify-between border-b border-border">
            <h2 className="text-sm font-medium tracking-[0.1em] uppercase">
              Top Products
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => setIsTopProductsOpen(true)}
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {topProducts.slice(0, 5).map((item: any, index: number) => {
              const imageUrl = typeof item.product.main_image === "string"
                ? item.product.main_image
                : "/placeholder.jpg"
              
              return (
                <div key={item.product.id} className="p-4 flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground w-4">
                    {index + 1}
                  </span>
                  <div className="relative w-12 h-12 bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(item.revenue)}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Top Products Modal */}
      <Dialog open={isTopProductsOpen} onOpenChange={setIsTopProductsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium tracking-[0.1em] uppercase">
              Top 10 Products
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border overflow-y-auto flex-1 -mx-6 px-6">
            {topProducts.slice(0, 10).map((item: any, index: number) => {
              const imageUrl = typeof item.product.main_image === "string"
                ? item.product.main_image
                : "/placeholder.jpg"
              
              return (
                <div key={item.product.id} className="py-4 flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <div className="relative w-14 h-14 bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(item.revenue)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatPrice(item.product.price)} each</p>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDashboard
