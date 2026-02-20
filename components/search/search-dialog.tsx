"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { searchProducts } from "@/app/actions/shop"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [categoryResults, setCategoryResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setQuery("")
      setResults([])
      setCategoryResults([])
    }
  }, [open])

  // Search logic with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setCategoryResults([])
      return
    }

    setIsSearching(true)
    
    const { products, categories } = await searchProducts(searchQuery)
    
    setResults(products)
    setCategoryResults(categories)
    setIsSearching(false)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  const handleResultClick = () => {
    onOpenChange(false)
  }

  const hasResults = results.length > 0 || categoryResults.length > 0
  const showNoResults = query.trim() && !hasResults && !isSearching

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-2xl p-0 gap-0 overflow-hidden border-border bg-background"
      >
        <DialogTitle className="sr-only">Search products and collections</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, collections..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 px-2 font-mono text-[10px] font-medium text-muted-foreground bg-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border border-muted-foreground border-t-transparent rounded-full"
                  />
                  Searching...
                </div>
              </motion.div>
            )}

            {/* No Query State */}
            {!query.trim() && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Start typing to search our collection
                </p>
                <div className="space-y-4">
                  <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Essentials", "Outerwear", "Cashmere", "Wool", "Leather"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors duration-300"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* No Results */}
            {showNoResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try searching for something else
                </p>
              </motion.div>
            )}

            {/* Results */}
            {hasResults && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-border"
              >
                {/* Category Results */}
                {categoryResults.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 px-2">
                      Collections
                    </p>
                    <div className="space-y-1">
                      {categoryResults.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, ease: premiumEasing }}
                        >
                          <Link
                            href={`/collections?category=${category.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center justify-between p-3 hover:bg-muted transition-colors duration-300 group"
                          >
                            <div>
                              <p className="font-medium">{category.name}</p>
                              {category.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight 
                              className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-premium" 
                              strokeWidth={1.5} 
                            />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Results */}
                {results.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 px-2">
                      Products
                    </p>
                    <div className="space-y-1">
                      {results.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (categoryResults.length + index) * 0.05, ease: premiumEasing }}
                        >
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-4 p-3 hover:bg-muted transition-colors duration-300 group"
                          >
                            <div className="relative h-16 w-16 bg-muted overflow-hidden flex-shrink-0">
                              <Image
                                src={product.main_image || "/placeholder.svg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {product.description}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono text-sm">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View All Link */}
                {results.length > 0 && (
                  <div className="p-4">
                    <Link
                      href={`/shop?search=${encodeURIComponent(query)}`}
                      onClick={handleResultClick}
                      className="flex items-center justify-center gap-2 p-3 text-sm font-medium hover:bg-muted transition-colors duration-300 group"
                    >
                      View all results for &ldquo;{query}&rdquo;
                      <ArrowRight 
                        className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300 ease-premium" 
                        strokeWidth={1.5} 
                      />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="h-5 px-1.5 font-mono text-[10px] bg-background border border-border">↑</kbd>
              <kbd className="h-5 px-1.5 font-mono text-[10px] bg-background border border-border">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="h-5 px-1.5 font-mono text-[10px] bg-background border border-border">↵</kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="h-5 px-1.5 font-mono text-[10px] bg-background border border-border">⌘</kbd>
            <kbd className="h-5 px-1.5 font-mono text-[10px] bg-background border border-border">K</kbd>
            to search
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
