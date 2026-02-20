"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAdminProducts, getAdminCategories } from "@/app/actions/admin"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"

export default function ProductsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [productsData, categoriesData] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory || product.category_id === selectedCategory
    const matchesStatus = !selectedStatus || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} products in catalog
          </p>
        </div>
        <Button asChild className="h-10 bg-foreground text-background hover:bg-foreground/90">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-border"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 border-border bg-transparent">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name 
                : "All Categories"
              }
              <ChevronDown className="h-4 w-4 ml-2" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
              All Categories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 border-border bg-transparent">
              {selectedStatus 
                ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) 
                : "All Status"
              }
              <ChevronDown className="h-4 w-4 ml-2" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
              All Status
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedStatus("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus("draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedStatus("archived")}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Products Table */}
      <div className="border border-border bg-background overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Product
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Category
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Price
          </span>
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">
            Status
          </span>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredProducts.map((product, index) => {
            const imageUrl = typeof product.main_image === "string"
              ? product.main_image
              : "/placeholder.jpg"
            const category = categories.find(
              (c) => c.id === product.category_id
            )

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3, ease: premiumEasing }}
                onClick={() => router.push(`/admin/products/${product.id}`)}
                className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px_100px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {/* Product Info */}
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 bg-muted flex-shrink-0 overflow-hidden">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>
                </div>

                {/* Category - Mobile label */}
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Category</span>
                  <span className="text-sm">{category?.name || "-"}</span>
                </div>

                {/* Price - Mobile label */}
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Price</span>
                  <span className="text-sm font-medium">{formatPrice(product.price)}</span>
                </div>

                {/* Status - Mobile label */}
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-muted-foreground md:hidden">Status</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-medium ${
                      product.status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : product.status === "draft"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {product.status}
                  </Badge>
                </div>

              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
