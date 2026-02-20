import { createClient } from "@/lib/supabase/server"
import type { Category } from "./types"

export async function getCategories(options?: {
  status?: "active" | "draft"
  limit?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })
  
  if (options?.status) {
    query = query.eq("status", options.status)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  
  return data as Category[]
}

export async function getCategoryById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching category:", error)
    return null
  }
  
  return data as Category
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single()
  
  if (error) {
    console.error("Error fetching category by slug:", error)
    return null
  }
  
  return data as Category
}

export async function createCategory(category: {
  name: string
  slug: string
  description?: string
  image?: string
  status?: "active" | "draft"
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single()
  
  if (error) {
    console.error("Error creating category:", error)
    return null
  }
  
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<{
  name: string
  slug: string
  description: string | null
  image: string | null
  status: "active" | "draft"
}>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating category:", error)
    return null
  }
  
  return data as Category
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting category:", error)
    return false
  }
  
  return true
}

export async function getCategoriesWithProductCount() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name", { ascending: true })
  
  if (error) {
    console.error("Error fetching categories with count:", error)
    return []
  }
  
  return data.map(cat => ({
    ...cat,
    productCount: (cat.products as unknown as { count: number }[])?.[0]?.count || 0
  }))
}
