import { createClient } from "@/lib/supabase/server"
import type { Product, ProductVariants } from "./types"

export async function getProducts(options?: {
  status?: "active" | "draft" | "archived"
  categoryId?: string
  featured?: boolean
  limit?: number
  offset?: number
  search?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("products")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId)
  }
  if (options?.featured !== undefined) {
    query = query.eq("featured", options.featured)
  }
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching products:", error)
    return []
  }
  
  return data as Product[]
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching product:", error)
    return null
  }
  
  return data as Product
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single()
  
  if (error) {
    console.error("Error fetching product by slug:", error)
    return null
  }
  
  return data as Product
}

export async function createProduct(product: {
  sku: string
  name: string
  slug: string
  description?: string
  price: number
  status?: "active" | "draft" | "archived"
  category_id?: string
  main_image?: string
  gallery?: string[]
  featured?: boolean
  variants?: ProductVariants
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single()
  
  if (error) {
    console.error("Error creating product:", error)
    return null
  }
  
  return data as Product
}

export async function updateProduct(id: string, updates: Partial<{
  sku: string
  name: string
  slug: string
  description: string | null
  price: number
  status: "active" | "draft" | "archived"
  category_id: string | null
  main_image: string | null
  gallery: string[] | null
  featured: boolean
  variants: ProductVariants | null
}>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating product:", error)
    return null
  }
  
  return data as Product
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting product:", error)
    return false
  }
  
  return true
}

export async function getProductsCount(options?: {
  status?: "active" | "draft" | "archived"
  categoryId?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("products")
    .select("*", { count: "exact", head: true })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId)
  }
  
  const { count, error } = await query
  
  if (error) {
    console.error("Error counting products:", error)
    return 0
  }
  
  return count || 0
}
