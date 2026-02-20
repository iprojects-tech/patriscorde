"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal, X, ChevronDown } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { premiumEasing } from "@/lib/motion"
import type { Product, Category } from "@/lib/db/types"

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
]

interface ShopContentProps {
  initialProducts: Product[]
  categories: Category[]
}

export function ShopContent({ initialProducts, categories }: ShopContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categoryParam = searchParams.get("category")
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam)
  const [sortBy, setSortBy] = useState("newest")
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Sync state with URL params
  useEffect(() => {
    setSelectedCategory(categoryParam)
  }, [categoryParam])
  
  // Update URL when category changes
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    if (category) {
      router.push(`/shop?category=${category}`, { scroll: false })
    } else {
      router.push("/shop", { scroll: false })
    }
  }

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts]
    
    // Filter by category
    if (selectedCategory) {
      const category = categories.find(c => c.slug === selectedCategory)
      if (category) {
        products = products.filter(p => p.category_id === category.id)
      }
    }
    
    // Sort
    switch (sortBy) {
      case "price-asc":
        products.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        products.sort((a, b) => b.price - a.price)
        break
      case "name":
        products.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
      default:
        products.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
    }
    
    return products
  }, [initialProducts, categories, selectedCategory, sortBy])

  const selectedSort = sortOptions.find(o => o.value === sortBy)

  // Convert DB product to component format
  const mapProduct = (product: Product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    main_image: product.main_image,
    category_id: product.category_id,
    status: product.status,
    featured: product.featured,
    gallery: product.gallery,
    variants: product.variants,
  })

  return (
    <>
      {/* Filters Bar */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <div className="flex items-center justify-between h-14">
            {/* Mobile Filter */}
            <div className="lg:hidden">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="h-9 px-3 gap-2 hover:bg-transparent">
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
                    <span className="text-xs font-medium tracking-[0.1em] uppercase">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-sm p-0">
                  <SheetHeader className="px-6 py-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-sm font-medium tracking-[0.15em] uppercase">
                        Filters
                      </SheetTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-transparent"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </SheetHeader>
                  <div className="p-6">
                    <FilterContent 
                      categories={categories} 
                      selectedCategory={selectedCategory}
                      onCategoryChange={(cat) => {
                        handleCategoryChange(cat)
                        setIsFilterOpen(false)
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-6">
              <Button
                variant="ghost"
                className={`h-9 px-3 text-xs font-medium tracking-[0.1em] uppercase hover:bg-transparent ${
                  !selectedCategory ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => handleCategoryChange(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className={`h-9 px-3 text-xs font-medium tracking-[0.1em] uppercase hover:bg-transparent ${
                    selectedCategory === category.slug ? "text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => handleCategoryChange(category.slug)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Product Count & Sort */}
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </span>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  className="h-9 px-3 gap-2 hover:bg-transparent"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  <span className="text-xs font-medium tracking-[0.1em] uppercase">
                    {selectedSort?.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
                </Button>
                
                <AnimatePresence>
                  {isSortOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsSortOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: premiumEasing }}
                        className="absolute right-0 top-full mt-2 w-48 bg-background border border-border shadow-lg z-50"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`w-full px-4 py-3 text-left text-xs font-medium tracking-[0.05em] uppercase hover:bg-muted transition-colors ${
                              sortBy === option.value ? "text-foreground" : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              setSortBy(option.value)
                              setIsSortOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${sortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
            >
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={mapProduct(product)} 
                  index={index}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function FilterContent({
  categories,
  selectedCategory,
  onCategoryChange,
}: {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (slug: string | null) => void
}) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-4">
        Category
      </h3>
      <div className="space-y-3">
        <button
          type="button"
          className={`block w-full text-left text-sm py-2 transition-colors ${
            !selectedCategory ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onCategoryChange(null)}
        >
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`block w-full text-left text-sm py-2 transition-colors ${
              selectedCategory === category.slug ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onCategoryChange(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
