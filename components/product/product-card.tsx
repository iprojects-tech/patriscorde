"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import type { Product, SelectedVariant } from "@/lib/directus/types"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isAdded, setIsAdded] = useState(false)
  
  const imageUrl = typeof product.main_image === "string" 
    ? product.main_image 
    : "/placeholder.jpg"

  const hasVariants = product.variants && (
    (product.variants.colors && product.variants.colors.length > 0) ||
    (product.variants.sizes && product.variants.sizes.length > 0)
  )
  
  const hasColors = product.variants?.colors && product.variants.colors.length > 0
  const hasSizes = product.variants?.sizes && product.variants.sizes.length > 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if variants are required but not selected
    if (hasColors && !selectedColor) {
      toast.error("Please select a color")
      return
    }
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size")
      return
    }
    
    const variant: SelectedVariant = {
      color: selectedColor || undefined,
      size: selectedSize || undefined,
    }
    
    addItem(product, 1, hasVariants ? variant : undefined)
    setIsAdded(true)
    
    // Reset after animation
    setTimeout(() => {
      setIsAdded(false)
      setSelectedColor(null)
      setSelectedSize(null)
    }, 1500)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: premiumEasing }}
      className="group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <motion.div 
          className="relative aspect-[3/4] bg-muted mb-5 overflow-hidden"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3, ease: premiumEasing }}
        >
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Quick Add Overlay with Variant Selection */}
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/90 backdrop-blur-0 group-hover:backdrop-blur-sm flex flex-col items-center justify-end pb-5 px-4 transition-all duration-500 ease-premium opacity-0 group-hover:opacity-100">
            <div className="w-full space-y-3 translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-premium">
              
              {/* Color Selector */}
              {hasColors && (
                <div 
                  className="flex items-center justify-center gap-2"
                  onClick={(e) => e.preventDefault()}
                >
                  {product.variants?.colors?.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedColor(color)
                      }}
                      className={`
                        relative w-7 h-7 border transition-all duration-200
                        ${selectedColor?.name === color.name 
                          ? "border-foreground scale-110" 
                          : "border-border hover:border-foreground/50"
                        }
                      `}
                      title={color.name}
                    >
                      <span
                        className="absolute inset-0.5"
                        style={{ backgroundColor: color.value }}
                      />
                      {selectedColor?.name === color.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check 
                            className="h-3 w-3" 
                            strokeWidth={2}
                            style={{ 
                              color: color.value === "#fafafa" || color.value === "#f5f5dc" || color.value === "#d4c5a9" || color.value === "#c2b280" || color.value === "#d2b48c" || color.value === "#add8e6" || color.value === "#e8ccd7"
                                ? "#1a1a1a" 
                                : "#fafafa" 
                            }}
                          />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Size Selector */}
              {hasSizes && (
                <div 
                  className="flex flex-wrap items-center justify-center gap-1.5"
                  onClick={(e) => e.preventDefault()}
                >
                  {product.variants?.sizes?.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedSize(size)
                      }}
                      className={`
                        min-w-[2rem] h-7 px-2 text-[10px] font-medium tracking-[0.05em] uppercase
                        border transition-all duration-200
                        ${selectedSize === size 
                          ? "bg-foreground text-background border-foreground" 
                          : "bg-background/80 text-foreground border-border hover:border-foreground"
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Add to Bag Button */}
              <Button
                variant="outline"
                className={`
                  w-full h-10 border-foreground text-xs font-medium tracking-[0.1em] uppercase
                  transition-all duration-300
                  ${isAdded 
                    ? "bg-foreground text-background" 
                    : "bg-transparent text-foreground hover:bg-foreground hover:text-background"
                  }
                `}
                onClick={handleAddToCart}
                disabled={isAdded}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Added
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Add to Bag
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-4 left-4">
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-foreground/70">
                Featured
              </span>
            </div>
          )}
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium leading-tight group-hover:underline underline-offset-4 transition-all duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  )
}
