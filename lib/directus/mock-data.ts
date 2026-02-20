import type { Product, Category } from "./types"

// Mock categories for development/demo
export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Essentials",
    slug: "essentials",
    status: "active",
    parent_id: null,
    description: "Timeless pieces for everyday wear",
  },
  {
    id: "cat-2",
    name: "Outerwear",
    slug: "outerwear",
    status: "active",
    parent_id: null,
    description: "Refined layers for every season",
  },
  {
    id: "cat-3",
    name: "Accessories",
    slug: "accessories",
    status: "active",
    parent_id: null,
    description: "Considered details that complete",
  },
  {
    id: "cat-4",
    name: "New Arrivals",
    slug: "new-arrivals",
    status: "active",
    parent_id: null,
    description: "The latest additions to our collection",
  },
]

// Standard variants for clothing
const clothingSizes = ["XS", "S", "M", "L", "XL"]
const clothingColors = [
  { name: "Black", value: "#1a1a1a" },
  { name: "White", value: "#fafafa" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Grey", value: "#6b7280" },
]

const accessoryColors = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Tan", value: "#d2b48c" },
  { name: "Dark Brown", value: "#4a3728" },
]

const scarfColors = [
  { name: "Charcoal", value: "#36454f" },
  { name: "Oatmeal", value: "#d4c5a9" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Burgundy", value: "#722f37" },
]

const beltSizes = ["85", "90", "95", "100", "105"]

// Mock products for development/demo
export const mockProducts: Product[] = [
  {
    id: "prod-1",
    sku: "ATL-ESS-001",
    name: "Relaxed Cotton Tee",
    slug: "relaxed-cotton-tee",
    description: "A perfectly weighted cotton t-shirt with a relaxed fit. Crafted from premium organic cotton with a subtle texture. The ideal foundation piece.",
    price: 85,
    status: "active",
    category_id: "cat-1",
    main_image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    ],
    featured: true,
    date_created: "2025-01-15",
    variants: {
      sizes: clothingSizes,
      colors: clothingColors,
    },
  },
  {
    id: "prod-2",
    sku: "ATL-ESS-002",
    name: "Merino Wool Sweater",
    slug: "merino-wool-sweater",
    description: "Exceptionally soft merino wool in a timeless silhouette. Temperature regulating and naturally breathable. Made to last generations.",
    price: 245,
    status: "active",
    category_id: "cat-1",
    main_image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    ],
    featured: true,
    date_created: "2025-01-14",
    variants: {
      sizes: clothingSizes,
      colors: [
        { name: "Charcoal", value: "#36454f" },
        { name: "Oatmeal", value: "#d4c5a9" },
        { name: "Navy", value: "#1e3a5f" },
      ],
    },
  },
  {
    id: "prod-3",
    sku: "ATL-OUT-001",
    name: "Wool Blend Overcoat",
    slug: "wool-blend-overcoat",
    description: "A refined overcoat in substantial Italian wool blend. Clean lines and impeccable construction. The ultimate outer layer.",
    price: 695,
    status: "active",
    category_id: "cat-2",
    main_image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80",
      "https://images.unsplash.com/photo-1544923246-77307dd628b5?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    ],
    featured: true,
    date_created: "2025-01-13",
    variants: {
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Black", value: "#1a1a1a" },
        { name: "Camel", value: "#c19a6b" },
        { name: "Charcoal", value: "#36454f" },
      ],
    },
  },
  {
    id: "prod-4",
    sku: "ATL-ACC-001",
    name: "Leather Card Holder",
    slug: "leather-card-holder",
    description: "Full-grain leather card holder with a minimalist design. Hand-finished edges and subtle embossing. Patinas beautifully with age.",
    price: 125,
    status: "active",
    category_id: "cat-3",
    main_image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80",
    featured: false,
    date_created: "2025-01-12",
    variants: {
      colors: accessoryColors,
    },
  },
  {
    id: "prod-5",
    sku: "ATL-ESS-003",
    name: "Tailored Trousers",
    slug: "tailored-trousers",
    description: "Impeccably tailored trousers in a seasonless wool blend. A relaxed yet refined silhouette that moves from office to evening.",
    price: 285,
    status: "active",
    category_id: "cat-1",
    main_image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    featured: true,
    date_created: "2025-01-11",
    variants: {
      sizes: ["28", "30", "32", "34", "36", "38"],
      colors: [
        { name: "Black", value: "#1a1a1a" },
        { name: "Charcoal", value: "#36454f" },
        { name: "Navy", value: "#1e3a5f" },
      ],
    },
  },
  {
    id: "prod-6",
    sku: "ATL-OUT-002",
    name: "Quilted Vest",
    slug: "quilted-vest",
    description: "Lightweight insulated vest with a refined quilted texture. Perfect for layering. Water-resistant shell with recycled fill.",
    price: 345,
    status: "active",
    category_id: "cat-2",
    main_image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    featured: false,
    date_created: "2025-01-10",
    variants: {
      sizes: clothingSizes,
      colors: [
        { name: "Black", value: "#1a1a1a" },
        { name: "Olive", value: "#556b2f" },
        { name: "Navy", value: "#1e3a5f" },
      ],
    },
  },
  {
    id: "prod-7",
    sku: "ATL-ACC-002",
    name: "Cashmere Scarf",
    slug: "cashmere-scarf",
    description: "Pure Mongolian cashmere in an generous proportion. Impossibly soft with a subtle sheen. An heirloom in the making.",
    price: 195,
    status: "active",
    category_id: "cat-3",
    main_image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80",
    featured: true,
    date_created: "2025-01-09",
    variants: {
      colors: scarfColors,
    },
  },
  {
    id: "prod-8",
    sku: "ATL-ESS-004",
    name: "Oxford Shirt",
    slug: "oxford-shirt",
    description: "Classic oxford cloth button-down with a modern proportion. Washed for softness, built for longevity. A wardrobe essential.",
    price: 145,
    status: "active",
    category_id: "cat-1",
    main_image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    featured: false,
    date_created: "2025-01-08",
    variants: {
      sizes: clothingSizes,
      colors: [
        { name: "White", value: "#fafafa" },
        { name: "Light Blue", value: "#add8e6" },
        { name: "Pink", value: "#e8ccd7" },
      ],
    },
  },
  {
    id: "prod-9",
    sku: "ATL-NEW-001",
    name: "Linen Blazer",
    slug: "linen-blazer",
    description: "Unstructured linen blazer with a relaxed elegance. Breathable and naturally textured. Designed for warm days and cool nights.",
    price: 425,
    status: "active",
    category_id: "cat-4",
    main_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    featured: true,
    date_created: "2025-01-20",
    variants: {
      sizes: ["S", "M", "L", "XL"],
      colors: [
        { name: "Natural", value: "#f5f5dc" },
        { name: "Navy", value: "#1e3a5f" },
        { name: "Sand", value: "#c2b280" },
      ],
    },
  },
  {
    id: "prod-10",
    sku: "ATL-NEW-002",
    name: "Leather Tote",
    slug: "leather-tote",
    description: "Vegetable-tanned leather tote with clean lines and considered details. Spacious yet structured. Built for daily ritual.",
    price: 485,
    status: "active",
    category_id: "cat-4",
    main_image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    featured: true,
    date_created: "2025-01-19",
    variants: {
      colors: accessoryColors,
    },
  },
  {
    id: "prod-11",
    sku: "ATL-ESS-005",
    name: "Cotton Knit Polo",
    slug: "cotton-knit-polo",
    description: "Fine-gauge cotton knit polo with a refined collar. Breathable construction with a subtle texture. Effortless sophistication.",
    price: 165,
    status: "active",
    category_id: "cat-1",
    main_image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80",
    featured: false,
    date_created: "2025-01-07",
    variants: {
      sizes: clothingSizes,
      colors: [
        { name: "White", value: "#fafafa" },
        { name: "Navy", value: "#1e3a5f" },
        { name: "Black", value: "#1a1a1a" },
      ],
    },
  },
  {
    id: "prod-12",
    sku: "ATL-ACC-003",
    name: "Leather Belt",
    slug: "leather-belt",
    description: "Bridle leather belt with a hand-polished brass buckle. Develops a rich patina over time. Built to last decades.",
    price: 175,
    status: "active",
    category_id: "cat-3",
    main_image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    featured: false,
    date_created: "2025-01-06",
    variants: {
      sizes: beltSizes,
      colors: accessoryColors,
    },
  },
]

// Helper to get mock data (simulates API)
export function getMockProducts(params?: {
  categorySlug?: string
  featured?: boolean
  limit?: number
  offset?: number
}): { data: Product[]; meta: { total_count: number } } {
  let filtered = [...mockProducts]
  
  if (params?.categorySlug) {
    const category = mockCategories.find(c => c.slug === params.categorySlug)
    if (category) {
      filtered = filtered.filter(p => p.category_id === category.id)
    }
  }
  
  if (params?.featured) {
    filtered = filtered.filter(p => p.featured)
  }
  
  const total = filtered.length
  const offset = params?.offset || 0
  const limit = params?.limit || 12
  
  filtered = filtered.slice(offset, offset + limit)
  
  return {
    data: filtered,
    meta: { total_count: total },
  }
}

export function getMockProductBySlug(slug: string): Product | null {
  return mockProducts.find(p => p.slug === slug) || null
}

export function getMockCategories(): { data: Category[]; meta: { total_count: number } } {
  return {
    data: mockCategories,
    meta: { total_count: mockCategories.length },
  }
}
