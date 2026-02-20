"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Plus, Minus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Reveal } from "@/components/motion/reveal"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"
import { ProductCard } from "@/components/product/product-card"
import type { ProductVariants, Category } from "@/lib/db/types"

interface ProductData {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  price: number
  main_image: string | null
  gallery: string[] | null
  category_id: string | null
  category?: Category
  variants: ProductVariants | null
}

interface RelatedProduct {
  id: string
  name: string
  slug: string
  price: number
  main_image: string | null
  category_id: string | null
  status: string
  featured: boolean
  gallery: string[] | null
  variants: ProductVariants | null
}

interface ProductDetailProps {
  product: ProductData
  relatedProducts: RelatedProduct[]
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.variants?.sizes?.[0]
  )
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | undefined>(
    product.variants?.colors?.[0]
  )
  const addItem = useCartStore((state) => state.addItem)

  const hasSizes = product.variants?.sizes && product.variants.sizes.length > 0
  const hasColors = product.variants?.colors && product.variants.colors.length > 0

  // Build gallery from product images
  const gallery: string[] = []
  if (product.gallery && product.gallery.length > 0) {
    product.gallery.forEach(img => {
      if (typeof img === "string") gallery.push(img)
    })
  } else if (typeof product.main_image === "string") {
    gallery.push(product.main_image)
  }
  
  const currentImage = gallery[selectedImageIndex] || "/placeholder.jpg"

  const handleAddToCart = () => {
    const variant = {
      size: selectedSize,
      color: selectedColor,
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        main_image: product.main_image,
        variants: product.variants,
      },
      quantity,
      variant
    )
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <main className="pt-20">
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12 py-4">
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="tracking-[0.1em] uppercase">Back to Shop</span>
          </Link>
        </div>
      </div>

      {/* Product */}
      <section className="py-12 lg:py-20 bg-background">
        <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Images */}
            <Reveal variant="fadeIn">
              <div className="space-y-4">
                {/* Main Image */}
                <motion.div 
                  className="relative aspect-[3/4] bg-muted overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.6, ease: premiumEasing }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={currentImage || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
                
                {/* Thumbnails */}
                {gallery.length > 1 && (
                  <div className="flex gap-3">
                    {gallery.map((img, index) => (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`
                          relative w-20 aspect-[3/4] bg-muted overflow-hidden transition-all duration-300
                          ${selectedImageIndex === index 
                            ? "ring-1 ring-foreground ring-offset-2" 
                            : "opacity-60 hover:opacity-100"
                          }
                        `}
                      >
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* Details */}
            <div className="lg:py-8">
              <Reveal>
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                  {product.sku}
                </p>
              </Reveal>
              
              <Reveal delay={0.1}>
                <h1 className="font-serif text-3xl lg:text-4xl xl:text-5xl tracking-tight mb-4">
                  {product.name}
                </h1>
              </Reveal>
              
              <Reveal delay={0.2}>
                <p className="text-xl lg:text-2xl font-light mb-8">
                  {formatPrice(product.price)}
                </p>
              </Reveal>
              
              <Reveal delay={0.3}>
                <p className="text-base text-muted-foreground leading-relaxed mb-10">
                  {product.description}
                </p>
              </Reveal>

              <Reveal delay={0.4}>
                <Separator className="bg-border mb-8" />
              </Reveal>

              {/* Color Selector */}
              {hasColors && (
                <Reveal delay={0.45}>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium tracking-[0.15em] uppercase">
                        Color
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedColor?.name}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {product.variants?.colors?.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`
                            relative w-10 h-10 border transition-all duration-300
                            ${selectedColor?.name === color.name 
                              ? "border-foreground" 
                              : "border-border hover:border-muted-foreground"
                            }
                          `}
                          title={color.name}
                        >
                          <span
                            className="absolute inset-1"
                            style={{ backgroundColor: color.value }}
                          />
                          {selectedColor?.name === color.name && (
                            <motion.span
                              layoutId="color-indicator"
                              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-foreground"
                              transition={{ duration: 0.2, ease: premiumEasing }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Size Selector */}
              {hasSizes && (
                <Reveal delay={0.5}>
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium tracking-[0.15em] uppercase">
                        Size
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                      >
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants?.sizes?.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`
                            min-w-[3rem] h-11 px-4 text-xs font-medium tracking-[0.1em] uppercase
                            border transition-all duration-300
                            ${selectedSize === size 
                              ? "bg-foreground text-background border-foreground" 
                              : "bg-transparent text-foreground border-border hover:border-foreground"
                            }
                          `}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Quantity & Add to Cart */}
              <Reveal delay={0.5}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                  <div className="flex items-center border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 hover:bg-transparent"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                    <span className="w-12 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 hover:bg-transparent"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                  
                  <Button
                    className="flex-1 h-14 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                    onClick={handleAddToCart}
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
                          <Check className="h-4 w-4" strokeWidth={1.5} />
                          Added to Bag
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
              </Reveal>

              {/* Accordion */}
              <Reveal delay={0.6}>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-border">
                    <AccordionTrigger className="text-xs font-medium tracking-[0.15em] uppercase py-5 hover:no-underline">
                      Product Details
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      <ul className="space-y-2">
                        <li>Crafted from premium materials</li>
                        <li>Designed for longevity</li>
                        <li>Timeless silhouette</li>
                        <li>Made with care in Portugal</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="care" className="border-border">
                    <AccordionTrigger className="text-xs font-medium tracking-[0.15em] uppercase py-5 hover:no-underline">
                      Care Instructions
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      <ul className="space-y-2">
                        <li>Dry clean recommended</li>
                        <li>Store in a cool, dry place</li>
                        <li>Use padded hangers</li>
                        <li>Steam to remove wrinkles</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="shipping" className="border-border">
                    <AccordionTrigger className="text-xs font-medium tracking-[0.15em] uppercase py-5 hover:no-underline">
                      Shipping & Returns
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      <ul className="space-y-2">
                        <li>Complimentary shipping on orders over 200</li>
                        <li>Express delivery available</li>
                        <li>30-day return policy</li>
                        <li>Free returns on all orders</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-20 lg:py-28 bg-secondary/30 border-t border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal className="mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight">
                You may also like
              </h2>
            </Reveal>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
