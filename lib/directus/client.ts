import type {
  Product,
  Category,
  Inventory,
  DirectusResponse,
  DirectusListResponse,
  ProductQueryParams,
} from "./types"

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://your-directus-instance.com"
const DIRECTUS_TOKEN = process.env.DIRECTUS_API_TOKEN

// Helper to build URLs with query params
function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  const url = new URL(`${DIRECTUS_URL}/items/${endpoint}`)
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          url.searchParams.set(key, JSON.stringify(value))
        } else {
          url.searchParams.set(key, String(value))
        }
      }
    }
  }
  
  return url.toString()
}

// Base fetch with auth
async function directusFetch<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  const url = buildUrl(endpoint, params)
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }
  
  if (DIRECTUS_TOKEN) {
    headers["Authorization"] = `Bearer ${DIRECTUS_TOKEN}`
  }
  
  const res = await fetch(url, {
    headers,
    next: { revalidate: 60 }, // Cache for 60 seconds
  })
  
  if (!res.ok) {
    throw new Error(`Directus error: ${res.status} ${res.statusText}`)
  }
  
  return res.json()
}

// Get asset URL
export function getAssetUrl(fileId: string | null | undefined, transforms?: {
  width?: number
  height?: number
  fit?: "cover" | "contain" | "inside" | "outside"
  quality?: number
  format?: "auto" | "webp" | "jpg" | "png"
}): string {
  if (!fileId) {
    return "/placeholder.jpg"
  }
  
  const url = new URL(`${DIRECTUS_URL}/assets/${fileId}`)
  
  if (transforms) {
    if (transforms.width) url.searchParams.set("width", String(transforms.width))
    if (transforms.height) url.searchParams.set("height", String(transforms.height))
    if (transforms.fit) url.searchParams.set("fit", transforms.fit)
    if (transforms.quality) url.searchParams.set("quality", String(transforms.quality))
    if (transforms.format) url.searchParams.set("format", transforms.format)
  }
  
  return url.toString()
}

// Products
export async function getProducts(
  params?: ProductQueryParams
): Promise<DirectusListResponse<Product>> {
  const queryParams: Record<string, unknown> = {
    filter: {
      status: { _eq: "active" },
      ...params?.filter,
    },
    fields: params?.fields || [
      "*",
      "category_id.id",
      "category_id.name",
      "category_id.slug",
      "main_image.*",
    ],
    sort: params?.sort || ["-date_created"],
    limit: params?.limit || 12,
    offset: params?.offset || 0,
  }
  
  if (params?.search) {
    queryParams.search = params.search
  }
  
  return directusFetch<DirectusListResponse<Product>>("products", queryParams)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const response = await directusFetch<DirectusListResponse<Product>>("products", {
    filter: {
      slug: { _eq: slug },
      status: { _eq: "active" },
    },
    fields: [
      "*",
      "category_id.id",
      "category_id.name",
      "category_id.slug",
      "main_image.*",
    ],
    limit: 1,
  })
  
  return response.data[0] || null
}

export async function getFeaturedProducts(): Promise<DirectusListResponse<Product>> {
  return getProducts({
    filter: { featured: { _eq: true } },
    limit: 8,
  })
}

// Categories
export async function getCategories(): Promise<DirectusListResponse<Category>> {
  return directusFetch<DirectusListResponse<Category>>("categories", {
    filter: {
      status: { _eq: "active" },
    },
    fields: ["*", "parent_id.id", "parent_id.name", "parent_id.slug"],
    sort: ["name"],
  })
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const response = await directusFetch<DirectusListResponse<Category>>("categories", {
    filter: {
      slug: { _eq: slug },
      status: { _eq: "active" },
    },
    limit: 1,
  })
  
  return response.data[0] || null
}

export async function getProductsByCategory(
  categorySlug: string,
  params?: Omit<ProductQueryParams, "filter">
): Promise<DirectusListResponse<Product>> {
  return getProducts({
    ...params,
    filter: {
      "category_id.slug": { _eq: categorySlug },
    },
  })
}

// Inventory
export async function getInventory(productId: string): Promise<Inventory | null> {
  const response = await directusFetch<DirectusListResponse<Inventory>>("inventory", {
    filter: {
      product_id: { _eq: productId },
    },
    limit: 1,
  })
  
  return response.data[0] || null
}

export async function checkStock(productId: string): Promise<{
  inStock: boolean
  quantity: number
}> {
  const inventory = await getInventory(productId)
  
  if (!inventory) {
    return { inStock: true, quantity: 99 } // Assume in stock if no inventory record
  }
  
  return {
    inStock: inventory.status !== "out_of_stock" && inventory.stock > 0,
    quantity: inventory.stock,
  }
}
