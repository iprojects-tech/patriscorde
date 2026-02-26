"use server"

import { pgQuery } from "@/lib/postgres"

export async function searchProducts(query: string) {
  if (!query.trim()) return { products: [], categories: [] }

  const normalizedQuery = `%${query.toLowerCase().trim()}%`

  const [productsResult, categoriesResult] = await Promise.all([
    pgQuery(
      `SELECT id, name, slug, description, price, main_image, sku, status
       FROM public.products
       WHERE status = 'active'
         AND (LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 OR LOWER(sku) LIKE $1)
       LIMIT 5`,
      [normalizedQuery],
    ),
    pgQuery(
      `SELECT id, name, slug, description
       FROM public.categories
       WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
       LIMIT 3`,
      [normalizedQuery],
    ),
  ])

  return {
    products: productsResult.rows || [],
    categories: categoriesResult.rows || [],
  }
}

export async function getShopCategories() {
  try {
    const result = await pgQuery(
      "SELECT id, name, slug, description FROM public.categories ORDER BY name ASC",
    )
    return result.rows
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getShopFeaturedProducts(limit = 4) {
  try {
    const result = await pgQuery(
      `SELECT id, name, slug, description, price, main_image, status
       FROM public.products
       WHERE status = 'active' AND featured = true
       LIMIT $1`,
      [limit],
    )
    return result.rows
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}
