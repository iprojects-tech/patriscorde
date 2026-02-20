import type { Product, Category } from "@/lib/directus/types"

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface OrderItem {
  id: string
  product: Product
  quantity: number
  price: number
  variant?: {
    size?: string
    color?: { name: string; value: string }
  }
}

export interface Order {
  id: string
  orderNumber: string
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  shippingAddress: {
    address: string
    city: string
    country: string
    postalCode: string
  }
  shippingMethod: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
  lastOrderAt?: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  recentOrders: Order[]
  topProducts: Array<{
    product: Product
    sold: number
    revenue: number
  }>
}
