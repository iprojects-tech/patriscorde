"use server"

import { getProducts, getProductBySlug } from "@/lib/db/products"
import { getCategories, getCategoryBySlug } from "@/lib/db/categories"
import { createOrder as createDbOrder, getOrderByNumber } from "@/lib/db/orders"
import { getOrCreateCustomer } from "@/lib/db/customers"
import type { Product, Category, Order } from "@/lib/db/types"

// Products
export async function fetchStoreProducts(options?: {
  categorySlug?: string
  featured?: boolean
  limit?: number
}) {
  let categoryId: string | undefined
  
  if (options?.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug)
    if (category) {
      categoryId = category.id
    }
  }
  
  return getProducts({
    status: "active",
    categoryId,
    featured: options?.featured,
    limit: options?.limit,
  })
}

export async function fetchProductBySlug(slug: string) {
  return getProductBySlug(slug)
}

export async function fetchFeaturedProducts(limit = 4) {
  return getProducts({
    status: "active",
    featured: true,
    limit,
  })
}

// Categories
export async function fetchStoreCategories() {
  return getCategories({ status: "active" })
}

export async function fetchCategoryBySlug(slug: string) {
  return getCategoryBySlug(slug)
}

// Orders
export async function createStoreOrder(data: {
  email: string
  name: string
  phone?: string
  address: string
  city: string
  country: string
  postalCode: string
  items: Array<{
    productId: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
    totalPrice: number
    variantSize?: string
    variantColor?: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
}) {
  // Get or create customer
  const customer = await getOrCreateCustomer(data.email, {
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    country: data.country,
    postal_code: data.postalCode,
  })
  
  if (!customer) {
    throw new Error("Failed to create customer")
  }
  
  // Create order
  const order = await createDbOrder({
    customer_id: customer.id,
    customer_email: data.email,
    customer_name: data.name,
    subtotal: data.subtotal,
    shipping: data.shipping,
    tax: data.tax,
    total: data.total,
    shipping_address: data.address,
    shipping_city: data.city,
    shipping_country: data.country,
    shipping_postal_code: data.postalCode,
    items: data.items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      variant_size: item.variantSize,
      variant_color: item.variantColor,
    })),
  })
  
  if (!order) {
    throw new Error("Failed to create order")
  }
  
  return order
}

export async function fetchOrderByNumber(orderNumber: string) {
  return getOrderByNumber(orderNumber)
}
