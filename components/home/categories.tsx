"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { ParallaxImage } from "@/components/motion/parallax"
import { premiumEasing } from "@/lib/motion"

interface CategoryData {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
}

interface CategoriesProps {
  categories?: CategoryData[]
}

const defaultCategories: CategoryData[] = [
  {
    id: "1",
    name: "Essentials",
    description: "Timeless foundations",
    slug: "essentials",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
  },
  {
    id: "2",
    name: "Outerwear",
    description: "Refined layers",
    slug: "outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
  },
  {
    id: "3",
    name: "Accessories",
    description: "Considered details",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
  },
]

export function Categories({ categories = defaultCategories }: CategoriesProps) {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
        {/* Header */}
        <Reveal className="mb-16">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Shop by Category
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">
            Explore collections
          </h2>
        </Reveal>

        {/* Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 0.15}>
              <CategoryCard category={category} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryCard({ 
  category 
}: { 
  category: CategoryData 
}) {
  return (
    <Link href={`/shop?category=${category.slug}`} className="group block">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.4, ease: premiumEasing }}
      >
        <div className="relative aspect-[4/5] overflow-hidden mb-6">
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: premiumEasing }}
          >
            <Image
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </motion.div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
          
          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, x: -10, y: 10 }}
            whileHover={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3, ease: premiumEasing }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background flex items-center justify-center"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </motion.div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-lg font-serif tracking-tight mb-1 group-hover:underline underline-offset-4 transition-all duration-300">
              {category.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {category.description || "View collection"}
            </p>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
