// Directus Collection Types

export interface DirectusFile {
  id: string
  storage: string
  filename_disk: string
  filename_download: string
  title: string | null
  type: string
  folder: string | null
  uploaded_by: string
  uploaded_on: string
  modified_by: string | null
  modified_on: string
  charset: string | null
  filesize: number
  width: number | null
  height: number | null
  duration: number | null
  embed: string | null
  description: string | null
  location: string | null
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

export interface Category {
  id: string
  name: string
  slug: string
  status: "active" | "draft" | "archived"
  parent_id: string | null
  parent?: Category
  children?: Category[]
  description?: string
  image?: DirectusFile | string
}

export interface ProductVariant {
  sizes?: string[]
  colors?: { name: string; value: string }[]
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  price: number
  status: "active" | "draft" | "archived"
  category_id: string | Category
  category?: Category
  main_image: DirectusFile | string
  gallery?: (DirectusFile | string)[]
  featured?: boolean
  date_created?: string
  date_updated?: string
  variants?: ProductVariant
}

export interface Inventory {
  id: string
  product_id: string | Product
  product?: Product
  stock: number
  status: "in_stock" | "low_stock" | "out_of_stock"
}

// API Response types
export interface DirectusResponse<T> {
  data: T
  meta?: {
    total_count?: number
    filter_count?: number
  }
}

export interface DirectusListResponse<T> {
  data: T[]
  meta?: {
    total_count?: number
    filter_count?: number
  }
}

// Query params
export interface ProductQueryParams {
  filter?: Record<string, unknown>
  sort?: string[]
  limit?: number
  offset?: number
  fields?: string[]
  search?: string
}

// Cart types
export interface SelectedVariant {
  size?: string
  color?: { name: string; value: string }
}

export interface CartItem {
  product: Product
  quantity: number
  variant?: SelectedVariant
}

export interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, variant?: SelectedVariant) => void
  removeItem: (productId: string, variant?: SelectedVariant) => void
  updateQuantity: (productId: string, quantity: number, variant?: SelectedVariant) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}
