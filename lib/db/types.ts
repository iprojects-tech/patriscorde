// Database types matching PostgreSQL schema

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  status: "active" | "draft"
  created_at: string
  updated_at: string
}

export interface ProductVariants {
  sizes?: string[]
  colors?: { name: string; value: string }[]
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  price: number // in cents
  status: "active" | "draft" | "archived"
  category_id: string | null
  main_image: string | null
  gallery: string[] | null
  featured: boolean
  variants: ProductVariants | null
  created_at: string
  updated_at: string
  // Joined data
  category?: Category
}

export interface Customer {
  id: string
  auth_user_id: string | null
  email: string
  name: string | null
  phone: string | null
  address: unknown | null
  city: string | null
  state: string | null
  neighborhood: string | null
  country: string | null
  postal_code: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number // in cents
  total_price: number // in cents
  variant_size: string | null
  variant_color: string | null
  // Joined data
  product?: Product
}

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  customer_email: string
  customer_name: string | null
  status: "pending" | "paid" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  subtotal: number // in cents
  shipping: number // in cents
  tax: number // in cents
  total: number // in cents
  shipping_address: unknown | null
  shipping_city?: string | null
  shipping_country?: string | null
  shipping_postal_code?: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  customer?: Customer
  items?: OrderItem[]
}

export interface AdminUser {
  id: string
  auth_user_id: string | null
  email: string
  name: string
  role: "admin" | "manager"
  created_at: string
}

// Utility functions
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100)
}

export function priceToDisplay(cents: number): number {
  return cents / 100
}

export function displayToPrice(display: number): number {
  return Math.round(display * 100)
}
