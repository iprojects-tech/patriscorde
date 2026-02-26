import { pgQuery } from "@/lib/postgres"
import type { Product, ProductVariants } from "./types"

export async function getProducts(options?: {
  status?: "active" | "draft" | "archived"
  categoryId?: string
  featured?: boolean
  limit?: number
  offset?: number
  search?: string
}) {
  const values: unknown[] = []
  const conditions: string[] = []

  if (options?.status) {
    values.push(options.status)
    conditions.push(`p.status = $${values.length}`)
  }
  if (options?.categoryId) {
    values.push(options.categoryId)
    conditions.push(`p.category_id = $${values.length}`)
  }
  if (options?.featured !== undefined) {
    values.push(options.featured)
    conditions.push(`p.featured = $${values.length}`)
  }
  if (options?.search) {
    values.push(`%${options.search}%`)
    conditions.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0
  values.push(limit, offset)

  const result = await pgQuery<Product & { category: unknown }>(
    `SELECT p.*, row_to_json(c) AS category
     FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  )
  return result.rows as Product[]
}

export async function getProductById(id: string) {
  const result = await pgQuery<Product & { category: unknown }>(
    `SELECT p.*, row_to_json(c) AS category
     FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     WHERE p.id = $1
     LIMIT 1`,
    [id],
  )
  return (result.rows[0] as Product) ?? null
}

export async function getProductBySlug(slug: string) {
  const result = await pgQuery<Product & { category: unknown }>(
    `SELECT p.*, row_to_json(c) AS category
     FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.status = 'active'
     LIMIT 1`,
    [slug],
  )
  return (result.rows[0] as Product) ?? null
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
  const result = await pgQuery<Product>(
    `INSERT INTO public.products
      (sku, name, slug, description, price, status, category_id, main_image, gallery, featured, variants)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      product.sku,
      product.name,
      product.slug,
      product.description ?? null,
      product.price,
      product.status ?? "draft",
      product.category_id ?? null,
      product.main_image ?? null,
      product.gallery ?? null,
      product.featured ?? false,
      product.variants ? JSON.stringify(product.variants) : null,
    ],
  )
  return result.rows[0] ?? null
}

export async function updateProduct(
  id: string,
  updates: Partial<{
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
  }>,
) {
  const result = await pgQuery<Product>(
    `UPDATE public.products
     SET
      sku = COALESCE($2, sku),
      name = COALESCE($3, name),
      slug = COALESCE($4, slug),
      description = COALESCE($5, description),
      price = COALESCE($6, price),
      status = COALESCE($7, status),
      category_id = COALESCE($8, category_id),
      main_image = COALESCE($9, main_image),
      gallery = COALESCE($10, gallery),
      featured = COALESCE($11, featured),
      variants = COALESCE($12, variants),
      updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      updates.sku ?? null,
      updates.name ?? null,
      updates.slug ?? null,
      updates.description ?? null,
      updates.price ?? null,
      updates.status ?? null,
      updates.category_id ?? null,
      updates.main_image ?? null,
      updates.gallery ?? null,
      updates.featured ?? null,
      updates.variants ? JSON.stringify(updates.variants) : null,
    ],
  )
  return result.rows[0] ?? null
}

export async function deleteProduct(id: string) {
  const result = await pgQuery("DELETE FROM public.products WHERE id = $1", [id])
  return (result.rowCount ?? 0) > 0
}

export async function getProductsCount(options?: {
  status?: "active" | "draft" | "archived"
  categoryId?: string
}) {
  const values: unknown[] = []
  const conditions: string[] = []

  if (options?.status) {
    values.push(options.status)
    conditions.push(`status = $${values.length}`)
  }
  if (options?.categoryId) {
    values.push(options.categoryId)
    conditions.push(`category_id = $${values.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await pgQuery<{ count: string }>(`SELECT COUNT(*)::text AS count FROM public.products ${where}`, values)
  return Number(result.rows[0]?.count ?? 0)
}
