import type { Order, Customer, DashboardStats } from "./types"
import { mockProducts } from "@/lib/directus/mock-data"

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "ATL-2025-0001",
    customer: {
      id: "cust-1",
      email: "emma.wilson@email.com",
      firstName: "Emma",
      lastName: "Wilson",
      phone: "+1 555 123 4567",
    },
    items: [
      {
        id: "item-1",
        product: mockProducts[0],
        quantity: 2,
        price: 85,
        variant: { size: "M", color: { name: "Black", value: "#1a1a1a" } },
      },
      {
        id: "item-2",
        product: mockProducts[1],
        quantity: 1,
        price: 245,
        variant: { size: "S", color: { name: "Charcoal", value: "#36454f" } },
      },
    ],
    subtotal: 415,
    shipping: 0,
    tax: 83,
    total: 498,
    status: "shipped",
    paymentStatus: "paid",
    shippingAddress: {
      address: "123 Fashion Ave",
      city: "New York",
      country: "United States",
      postalCode: "10001",
    },
    shippingMethod: "Express",
    createdAt: "2025-01-25T14:30:00Z",
    updatedAt: "2025-01-26T09:15:00Z",
  },
  {
    id: "ord-2",
    orderNumber: "ATL-2025-0002",
    customer: {
      id: "cust-2",
      email: "james.chen@email.com",
      firstName: "James",
      lastName: "Chen",
    },
    items: [
      {
        id: "item-3",
        product: mockProducts[2],
        quantity: 1,
        price: 695,
        variant: { size: "L", color: { name: "Camel", value: "#c19a6b" } },
      },
    ],
    subtotal: 695,
    shipping: 0,
    tax: 139,
    total: 834,
    status: "processing",
    paymentStatus: "paid",
    shippingAddress: {
      address: "456 Style Street",
      city: "Los Angeles",
      country: "United States",
      postalCode: "90001",
    },
    shippingMethod: "Standard",
    createdAt: "2025-01-26T10:00:00Z",
    updatedAt: "2025-01-26T10:00:00Z",
  },
  {
    id: "ord-3",
    orderNumber: "ATL-2025-0003",
    customer: {
      id: "cust-3",
      email: "sofia.martinez@email.com",
      firstName: "Sofia",
      lastName: "Martinez",
      phone: "+1 555 987 6543",
    },
    items: [
      {
        id: "item-4",
        product: mockProducts[3],
        quantity: 1,
        price: 125,
        variant: { color: { name: "Tan", value: "#d2b48c" } },
      },
      {
        id: "item-5",
        product: mockProducts[6],
        quantity: 2,
        price: 195,
        variant: { color: { name: "Oatmeal", value: "#d4c5a9" } },
      },
    ],
    subtotal: 515,
    shipping: 15,
    tax: 103,
    total: 633,
    status: "delivered",
    paymentStatus: "paid",
    shippingAddress: {
      address: "789 Elegant Blvd",
      city: "Chicago",
      country: "United States",
      postalCode: "60601",
    },
    shippingMethod: "Standard",
    createdAt: "2025-01-20T16:45:00Z",
    updatedAt: "2025-01-24T11:30:00Z",
  },
  {
    id: "ord-4",
    orderNumber: "ATL-2025-0004",
    customer: {
      id: "cust-4",
      email: "oliver.brown@email.com",
      firstName: "Oliver",
      lastName: "Brown",
    },
    items: [
      {
        id: "item-6",
        product: mockProducts[4],
        quantity: 2,
        price: 285,
        variant: { size: "32", color: { name: "Black", value: "#1a1a1a" } },
      },
    ],
    subtotal: 570,
    shipping: 0,
    tax: 114,
    total: 684,
    status: "pending",
    paymentStatus: "pending",
    shippingAddress: {
      address: "321 Modern Lane",
      city: "San Francisco",
      country: "United States",
      postalCode: "94102",
    },
    shippingMethod: "Express",
    createdAt: "2025-01-27T08:00:00Z",
    updatedAt: "2025-01-27T08:00:00Z",
  },
  {
    id: "ord-5",
    orderNumber: "ATL-2025-0005",
    customer: {
      id: "cust-5",
      email: "ava.johnson@email.com",
      firstName: "Ava",
      lastName: "Johnson",
      phone: "+1 555 456 7890",
    },
    items: [
      {
        id: "item-7",
        product: mockProducts[8],
        quantity: 1,
        price: 425,
        variant: { size: "M", color: { name: "Navy", value: "#1e3a5f" } },
      },
      {
        id: "item-8",
        product: mockProducts[9],
        quantity: 1,
        price: 485,
        variant: { color: { name: "Black", value: "#1a1a1a" } },
      },
    ],
    subtotal: 910,
    shipping: 0,
    tax: 182,
    total: 1092,
    status: "confirmed",
    paymentStatus: "paid",
    shippingAddress: {
      address: "555 Luxury Way",
      city: "Miami",
      country: "United States",
      postalCode: "33101",
    },
    shippingMethod: "Express",
    createdAt: "2025-01-26T22:15:00Z",
    updatedAt: "2025-01-27T06:00:00Z",
  },
]

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    email: "emma.wilson@email.com",
    firstName: "Emma",
    lastName: "Wilson",
    phone: "+1 555 123 4567",
    totalOrders: 5,
    totalSpent: 2340,
    createdAt: "2024-06-15T10:00:00Z",
    lastOrderAt: "2025-01-25T14:30:00Z",
  },
  {
    id: "cust-2",
    email: "james.chen@email.com",
    firstName: "James",
    lastName: "Chen",
    totalOrders: 3,
    totalSpent: 1567,
    createdAt: "2024-08-20T14:30:00Z",
    lastOrderAt: "2025-01-26T10:00:00Z",
  },
  {
    id: "cust-3",
    email: "sofia.martinez@email.com",
    firstName: "Sofia",
    lastName: "Martinez",
    phone: "+1 555 987 6543",
    totalOrders: 8,
    totalSpent: 4250,
    createdAt: "2024-03-10T09:00:00Z",
    lastOrderAt: "2025-01-20T16:45:00Z",
  },
  {
    id: "cust-4",
    email: "oliver.brown@email.com",
    firstName: "Oliver",
    lastName: "Brown",
    totalOrders: 1,
    totalSpent: 684,
    createdAt: "2025-01-27T08:00:00Z",
    lastOrderAt: "2025-01-27T08:00:00Z",
  },
  {
    id: "cust-5",
    email: "ava.johnson@email.com",
    firstName: "Ava",
    lastName: "Johnson",
    phone: "+1 555 456 7890",
    totalOrders: 12,
    totalSpent: 8750,
    createdAt: "2023-11-05T16:00:00Z",
    lastOrderAt: "2025-01-26T22:15:00Z",
  },
]

// Revenue Chart Data
export const revenueChartData = {
  "7days": [
    { label: "Mon", revenue: 2400, orders: 12 },
    { label: "Tue", revenue: 1800, orders: 9 },
    { label: "Wed", revenue: 3200, orders: 16 },
    { label: "Thu", revenue: 2800, orders: 14 },
    { label: "Fri", revenue: 4100, orders: 21 },
    { label: "Sat", revenue: 3600, orders: 18 },
    { label: "Sun", revenue: 2100, orders: 11 },
  ],
  "months": [
    { label: "Jan", revenue: 18500, orders: 92 },
    { label: "Feb", revenue: 21200, orders: 106 },
    { label: "Mar", revenue: 19800, orders: 99 },
    { label: "Apr", revenue: 24500, orders: 122 },
    { label: "May", revenue: 22100, orders: 110 },
    { label: "Jun", revenue: 26800, orders: 134 },
    { label: "Jul", revenue: 28400, orders: 142 },
    { label: "Aug", revenue: 25600, orders: 128 },
    { label: "Sep", revenue: 29200, orders: 146 },
    { label: "Oct", revenue: 31500, orders: 157 },
    { label: "Nov", revenue: 35800, orders: 179 },
    { label: "Dec", revenue: 42100, orders: 210 },
  ],
  "years": [
    { label: "2020", revenue: 145000, orders: 725 },
    { label: "2021", revenue: 198000, orders: 990 },
    { label: "2022", revenue: 256000, orders: 1280 },
    { label: "2023", revenue: 312000, orders: 1560 },
    { label: "2024", revenue: 385000, orders: 1925 },
    { label: "2025", revenue: 42100, orders: 210 },
  ],
}

export type ChartPeriod = keyof typeof revenueChartData

// Dashboard Stats
export function getMockDashboardStats(): DashboardStats {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = mockOrders.length
  const totalCustomers = mockCustomers.length
  const totalProducts = mockProducts.length

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueChange: 12.5,
    ordersChange: 8.3,
    customersChange: 15.2,
    recentOrders: mockOrders.slice(0, 5),
    topProducts: [
      { product: mockProducts[2], sold: 24, revenue: 16680 },
      { product: mockProducts[1], sold: 18, revenue: 4410 },
      { product: mockProducts[8], sold: 15, revenue: 6375 },
      { product: mockProducts[9], sold: 12, revenue: 5820 },
      { product: mockProducts[0], sold: 45, revenue: 3825 },
      { product: mockProducts[3], sold: 32, revenue: 4000 },
      { product: mockProducts[4], sold: 28, revenue: 7980 },
      { product: mockProducts[5], sold: 22, revenue: 3630 },
      { product: mockProducts[6], sold: 19, revenue: 3705 },
      { product: mockProducts[7], sold: 16, revenue: 5440 },
    ],
  }
}

export function getMockOrders() {
  return mockOrders
}

export function getMockOrderById(id: string) {
  return mockOrders.find(o => o.id === id) || null
}

export function getMockCustomers() {
  return mockCustomers
}
