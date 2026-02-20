"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/reveal"
import { Parallax } from "@/components/motion/parallax"
import { getShopCategories } from "@/app/actions/shop"
import { premiumEasing } from "@/lib/motion"

// Collection data with editorial imagery
const collections = [
  {
    id: "spring-25",
    title: "Spring 2025",
    subtitle: "Quiet Beginnings",
    description: "A contemplative collection exploring the space between seasons. Soft textures, muted tones, and considered silhouettes.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    href: "/shop?collection=spring-25",
    featured: true,
  },
  {
    id: "essentials",
    title: "The Essentials",
    subtitle: "Foundation Pieces",
    description: "The building blocks of a considered wardrobe. Timeless designs refined over time, crafted to last.",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80",
    href: "/shop?category=essentials",
    featured: false,
  },
  {
    id: "outerwear",
    title: "Outerwear",
    subtitle: "The Final Layer",
    description: "Protective pieces that define the silhouette. From structured coats to relaxed layers.",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80",
    href: "/shop?category=outerwear",
    featured: false,
  },
  {
    id: "accessories",
    title: "Accessories",
    subtitle: "Considered Details",
    description: "The finishing touches. Small goods and accessories crafted with the same attention as our garments.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
    href: "/shop?category=accessories",
    featured: false,
  },
]

export default function CollectionsPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const cats = await getShopCategories()
      setCategories(cats)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const featuredCollection = collections.find(c => c.featured)
  const otherCollections = collections.filter(c => !c.featured)

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-background border-b border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Curated Selections
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight max-w-3xl">
                Collections
              </h1>
            </Reveal>
          </div>
        </section>

        {/* Featured Collection - Full Width */}
        {featuredCollection && (
          <section className="relative">
            <Link href={featuredCollection.href} className="group block">
              <div className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
                <Parallax speed={0.15} className="absolute inset-0">
                  <Image
                    src={featuredCollection.image || "/placeholder.svg"}
                    alt={featuredCollection.title}
                    fill
                    className="object-cover transition-transform duration-1000 ease-premium group-hover:scale-105"
                    priority
                  />
                </Parallax>
                <div className="absolute inset-0 bg-foreground/20" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-end">
                  <div className="mx-auto max-w-[1800px] w-full px-6 lg:px-12 pb-16 lg:pb-24">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: premiumEasing }}
                      viewport={{ once: true }}
                      className="max-w-xl"
                    >
                      <p className="text-xs font-medium tracking-[0.3em] uppercase text-background/70 mb-4">
                        Featured Collection
                      </p>
                      <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl text-background mb-4">
                        {featuredCollection.title}
                      </h2>
                      <p className="text-lg text-background/80 font-light mb-2">
                        {featuredCollection.subtitle}
                      </p>
                      <p className="text-sm text-background/60 leading-relaxed max-w-md mb-8">
                        {featuredCollection.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-background group-hover:gap-4 transition-all duration-500 ease-premium">
                        Explore Collection
                        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Collection Grid */}
        <section className="py-20 lg:py-32 bg-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal className="mb-16">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Browse By
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight">
                Shop by Category
              </h2>
            </Reveal>

            <StaggerReveal className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {otherCollections.map((collection) => (
                <StaggerItem key={collection.id}>
                  <Link href={collection.href} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-6">
                      <Image
                        src={collection.image || "/placeholder.svg"}
                        alt={collection.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl lg:text-2xl tracking-tight group-hover:text-muted-foreground transition-colors duration-300">
                        {collection.title}
                      </h3>
                      <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                        {collection.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {collection.description}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* Editorial Divider */}
        <section className="py-24 lg:py-40 bg-secondary border-y border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="max-w-3xl mx-auto text-center">
              <Reveal>
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
                  Our Philosophy
                </p>
                <blockquote className="font-serif text-2xl lg:text-3xl xl:text-4xl tracking-tight leading-relaxed text-foreground/90">
                  "We believe in the quiet power of well-made things. Each piece in our collection is designed to endure — in quality, in style, in meaning."
                </blockquote>
              </Reveal>
            </div>
          </div>
        </section>

        {/* All Categories List */}
        <section className="py-20 lg:py-32 bg-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal className="mb-16">
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight">
                All Categories
              </h2>
            </Reveal>

            <div className="border-t border-border">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="group flex items-center justify-between py-8 border-b border-border hover:bg-muted/30 transition-colors duration-300 -mx-6 px-6 lg:-mx-12 lg:px-12"
                  >
                    <div className="flex items-baseline gap-4 lg:gap-8">
                      <span className="text-xs font-mono text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-serif text-2xl lg:text-3xl tracking-tight group-hover:text-muted-foreground transition-colors duration-300">
                        {category.name}
                      </h3>
                    </div>
                    <ArrowRight 
                      className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-premium" 
                      strokeWidth={1.5} 
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
