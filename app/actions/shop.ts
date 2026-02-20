"use server"

import { createClient } from "@/lib/supabase/server"

export async function searchProducts(query: string) {
  if (!query.trim()) return { products: [], categories: [] }
  
  const supabase = await createClient()
  const normalizedQuery = query.toLowerCase().trim()
  
  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, description, price, main_image, sku, status")
      .eq("status", "active")
      .or(`name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%,sku.ilike.%${normalizedQuery}%`)
      .limit(5),
    supabase
      .from("categories")
      .select("id, name, slug, description")
      .or(`name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
      .limit(3),
  ])
  
  return {
    products: productsResult.data || [],
    categories: categoriesResult.data || [],
  }
}

export async function getShopCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .order("name", { ascending: true })
  
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  
  return data
}

export async function getShopFeaturedProducts(limit = 4) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, description, price, main_image, status")
    .eq("status", "active")
    .eq("featured", true)
    .limit(limit)
  
  if (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
  
  return data
}
