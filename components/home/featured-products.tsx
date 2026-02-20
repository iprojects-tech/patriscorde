"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/reveal"
import { ProductCard } from "@/components/product/product-card"
import type { Product } from "@/lib/directus/types"

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Curated Selection
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">
              Featured pieces
            </h2>
          </Reveal>
          
          <Reveal delay={0.2}>
            <Button
              asChild
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent group"
            >
              <Link href="/shop" className="flex items-center gap-2">
                <span className="text-xs font-medium tracking-[0.15em] uppercase">
                  View All
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-premium group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>
            </Button>
          </Reveal>
        </div>

        {/* Product Grid */}
        <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <StaggerItem key={product.id}>
              <ProductCard product={product} index={index} />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}
