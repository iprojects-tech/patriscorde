import { pgQuery } from "@/lib/postgres"
import type { Category } from "./types"

export async function getCategories(options?: {
  status?: "active" | "draft"
  limit?: number
}) {
  const values: unknown[] = []
  let sql = "SELECT * FROM public.categories"

  if (options?.status) {
    values.push(options.status)
    sql += ` WHERE status = $${values.length}`
  }

  sql += " ORDER BY name ASC"

  if (options?.limit) {
    values.push(options.limit)
    sql += ` LIMIT $${values.length}`
  }

  const result = await pgQuery<Category>(sql, values)
  return result.rows
}

export async function getCategoryById(id: string) {
  const result = await pgQuery<Category>("SELECT * FROM public.categories WHERE id = $1 LIMIT 1", [id])
  return result.rows[0] ?? null
}

export async function getCategoryBySlug(slug: string) {
  const result = await pgQuery<Category>(
    "SELECT * FROM public.categories WHERE slug = $1 AND status = 'active' LIMIT 1",
    [slug],
  )
  return result.rows[0] ?? null
}

export async function createCategory(category: {
  name: string
  slug: string
  description?: string
  image?: string
  status?: "active" | "draft"
}) {
  const result = await pgQuery<Category>(
    `INSERT INTO public.categories (name, slug, description, image, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [category.name, category.slug, category.description ?? null, category.image ?? null, category.status ?? "active"],
  )
  return result.rows[0] ?? null
}

export async function updateCategory(
  id: string,
  updates: Partial<{
    name: string
    slug: string
    description: string | null
    image: string | null
    status: "active" | "draft"
  }>,
) {
  const result = await pgQuery<Category>(
    `UPDATE public.categories
     SET
       name = COALESCE($2, name),
       slug = COALESCE($3, slug),
       description = COALESCE($4, description),
       image = COALESCE($5, image),
       status = COALESCE($6, status),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, updates.name ?? null, updates.slug ?? null, updates.description ?? null, updates.image ?? null, updates.status ?? null],
  )
  return result.rows[0] ?? null
}

export async function deleteCategory(id: string) {
  const result = await pgQuery("DELETE FROM public.categories WHERE id = $1", [id])
  return (result.rowCount ?? 0) > 0
}

export async function getCategoriesWithProductCount() {
  const result = await pgQuery<
    Category & {
      productcount: string
    }
  >(
    `SELECT c.*, COUNT(p.id)::text AS productcount
     FROM public.categories c
     LEFT JOIN public.products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`,
  )

  return result.rows.map((row) => ({
    ...row,
    productCount: Number(row.productcount || 0),
  }))
}
