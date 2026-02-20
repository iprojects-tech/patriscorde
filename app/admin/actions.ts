"use server"

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsCount,
} from "@/lib/db/products"
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithProductCount,
} from "@/lib/db/categories"
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersCount,
  getOrdersRevenue,
} from "@/lib/db/orders"
import {
  getCustomers,
  getCustomersCount,
} from "@/lib/db/customers"
import type { Product, Category, Order } from "@/lib/db/types"

// Products
export async function fetchProducts(options?: Parameters<typeof getProducts>[0]) {
  return getProducts(options)
}

export async function fetchProductById(id: string) {
  return getProductById(id)
}

export async function saveProduct(id: string | null, data: {
  sku: string
  name: string
  slug: string
  description?: string
  price: number
  status: "active" | "draft" | "archived"
  category_id?: string | null
  main_image?: string | null
  gallery?: string[] | null
  featured?: boolean
  variants?: Product["variants"]
}) {
  if (id) {
    return updateProduct(id, data)
  } else {
    return createProduct({
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      status: data.status,
      category_id: data.category_id || undefined,
      main_image: data.main_image || undefined,
      gallery: data.gallery || undefined,
      featured: data.featured,
      variants: data.variants || undefined,
    })
  }
}

export async function removeProduct(id: string) {
  return deleteProduct(id)
}

export async function fetchProductsCount(options?: Parameters<typeof getProductsCount>[0]) {
  return getProductsCount(options)
}

// Categories
export async function fetchCategories(options?: Parameters<typeof getCategories>[0]) {
  return getCategories(options)
}

export async function fetchCategoriesWithCount() {
  return getCategoriesWithProductCount()
}

export async function fetchCategoryById(id: string) {
  return getCategoryById(id)
}

export async function saveCategory(id: string | null, data: {
  name: string
  slug: string
  description?: string | null
  image?: string | null
  status: "active" | "draft"
}) {
  if (id) {
    return updateCategory(id, data)
  } else {
    return createCategory({
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      image: data.image || undefined,
      status: data.status,
    })
  }
}

export async function removeCategory(id: string) {
  return deleteCategory(id)
}

// Orders
export async function fetchOrders(options?: Parameters<typeof getOrders>[0]) {
  return getOrders(options)
}

export async function fetchOrderById(id: string) {
  return getOrderById(id)
}

export async function changeOrderStatus(id: string, status: Order["status"]) {
  return updateOrderStatus(id, status)
}

export async function fetchOrdersCount(options?: Parameters<typeof getOrdersCount>[0]) {
  return getOrdersCount(options)
}

export async function fetchOrdersRevenue(options?: Parameters<typeof getOrdersRevenue>[0]) {
  return getOrdersRevenue(options)
}

// Customers
export async function fetchCustomers(options?: Parameters<typeof getCustomers>[0]) {
  return getCustomers(options)
}

export async function fetchCustomersCount() {
  return getCustomersCount()
}

// Dashboard Stats
export async function fetchDashboardStats() {
  const [totalRevenue, totalOrders, totalCustomers, totalProducts, recentOrders, products] = await Promise.all([
    getOrdersRevenue(),
    getOrdersCount(),
    getCustomersCount(),
    getProductsCount(),
    getOrders({ limit: 5 }),
    getProducts({ limit: 10, status: "active" }),
  ])

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueChange: 12.5, // Would calculate from historical data
    ordersChange: 8.3,
    customersChange: 15.2,
    recentOrders,
    topProducts: products.slice(0, 10).map((product, index) => ({
      product,
      sold: Math.floor(Math.random() * 50) + 10,
      revenue: product.price * (Math.floor(Math.random() * 50) + 10),
    })),
  }
}
