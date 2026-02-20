"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/reveal"
import { Parallax } from "@/components/motion/parallax"
import { Separator } from "@/components/ui/separator"
import { premiumEasing } from "@/lib/motion"

const values = [
  {
    title: "Considered Design",
    description: "Every detail serves a purpose. We remove the unnecessary to reveal what matters.",
  },
  {
    title: "Quality Materials",
    description: "We source the finest natural materials from trusted partners who share our values.",
  },
  {
    title: "Timeless Approach",
    description: "We design for longevity, not trends. Pieces that remain relevant season after season.",
  },
  {
    title: "Responsible Craft",
    description: "Made with respect for people and planet. Fair wages, sustainable practices, lasting impact.",
  },
]

const timeline = [
  { year: "2018", event: "Founded in Stockholm with a vision for quiet luxury" },
  { year: "2020", event: "Opened our first atelier and flagship store" },
  { year: "2022", event: "Launched sustainable materials initiative" },
  { year: "2024", event: "Expanded to international markets" },
  { year: "2025", event: "Celebrating our commitment to timeless design" },
]

export default function AboutPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section ref={heroRef} className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
          <motion.div style={{ scale: heroScale }} className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
              alt="Atelier workspace"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-foreground/30" />
          </motion.div>
          
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="relative h-full flex items-end"
          >
            <div className="mx-auto max-w-[1800px] w-full px-6 lg:px-12 pb-16 lg:pb-24">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: premiumEasing }}
                className="max-w-2xl"
              >
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-background/70 mb-4">
                  Our Story
                </p>
                <h1 className="font-serif text-4xl lg:text-5xl xl:text-7xl text-background tracking-tight">
                  About Atelier
                </h1>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Introduction */}
        <section className="py-24 lg:py-40 bg-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              <Reveal>
                <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
                  Who We Are
                </p>
                <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl tracking-tight leading-tight">
                  We create essentials for those who appreciate the beauty of restraint.
                </h2>
              </Reveal>
              
              <Reveal delay={0.2}>
                <div className="space-y-6 text-muted-foreground leading-relaxed lg:pt-8">
                  <p>
                    Atelier was founded on a simple belief: that the things we choose to live with should be chosen with intention. In a world of excess, we find meaning in reduction.
                  </p>
                  <p>
                    Each piece in our collection represents a dialogue between tradition and innovation. We work with master craftspeople who share our obsession with detail, using materials selected for their integrity and longevity.
                  </p>
                  <p>
                    Our approach is unhurried. We take the time to get things right, releasing collections when they're ready, not when the calendar demands. This patience is reflected in every stitch, every seam, every carefully considered proportion.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Full Width Image */}
        <section className="relative h-[50vh] lg:h-[70vh] overflow-hidden">
          <Parallax speed={0.1} className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1600&q=80"
              alt="Fabric detail"
              fill
              className="object-cover"
            />
          </Parallax>
        </section>

        {/* Values */}
        <section className="py-24 lg:py-40 bg-secondary">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal className="mb-16 lg:mb-24">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                What Guides Us
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight">
                Our Values
              </h2>
            </Reveal>

            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
              {values.map((value, index) => (
                <StaggerItem key={index}>
                  <div className="space-y-4">
                    <span className="text-xs font-mono text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif text-xl lg:text-2xl tracking-tight">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-24 lg:py-40 bg-background border-y border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <Reveal>
                <blockquote className="font-serif text-2xl lg:text-4xl xl:text-5xl tracking-tight leading-tight text-foreground/90 mb-8">
                  "True elegance is the conscious reduction of complexity until only the essential remains."
                </blockquote>
                <cite className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground not-italic">
                  — Elena Varga, Founder
                </cite>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Craftsmanship */}
        <section className="py-24 lg:py-40 bg-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Image */}
              <Reveal className="order-2 lg:order-1">
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <Image
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=80"
                    alt="Craftsmanship detail"
                    fill
                    className="object-cover"
                  />
                </div>
              </Reveal>

              {/* Content */}
              <div className="order-1 lg:order-2 flex flex-col justify-center">
                <Reveal>
                  <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
                    Our Craft
                  </p>
                  <h2 className="font-serif text-3xl lg:text-4xl tracking-tight mb-8">
                    The Art of Making
                  </h2>
                </Reveal>
                
                <Reveal delay={0.1}>
                  <div className="space-y-6 text-muted-foreground leading-relaxed">
                    <p>
                      Our atelier is where ideas become objects. Here, skilled artisans bring decades of expertise to every piece, combining time-honored techniques with contemporary innovation.
                    </p>
                    <p>
                      We believe that how something is made is just as important as what it looks like. Each garment passes through multiple hands, each contributing their specialized knowledge to the final result.
                    </p>
                    <p>
                      This process takes time. It cannot be rushed. And we believe this patience is something you can feel when you wear our pieces — a certain quality that only comes from unhurried, dedicated craft.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 lg:py-40 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <Reveal className="mb-16 lg:mb-24">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Journey
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight">
                Timeline
              </h2>
            </Reveal>

            <div className="space-y-0">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: premiumEasing }}
                  viewport={{ once: true }}
                  className="grid grid-cols-12 gap-6 py-8 border-b border-border"
                >
                  <div className="col-span-3 lg:col-span-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {item.year}
                    </span>
                  </div>
                  <div className="col-span-9 lg:col-span-10">
                    <p className="text-foreground">
                      {item.event}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team/Culture Section */}
        <section className="py-24 lg:py-40 bg-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <Reveal>
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                    alt="Team member"
                    fill
                    className="object-cover"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="relative aspect-[3/4] overflow-hidden bg-muted lg:mt-16">
                  <Image
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80"
                    alt="Team member"
                    fill
                    className="object-cover"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="relative aspect-[3/4] overflow-hidden bg-muted lg:mt-32">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80"
                    alt="Team member"
                    fill
                    className="object-cover"
                  />
                </div>
              </Reveal>
            </div>

            <Reveal className="mt-16 lg:mt-24 max-w-2xl">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Our Team
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tight mb-6">
                People Behind the Pieces
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our team brings together designers, artisans, and thinkers from diverse backgrounds, united by a shared commitment to excellence. Together, we question conventions and refine our craft.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 lg:py-40 bg-foreground text-background">
          <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
              <Reveal>
                <div className="max-w-xl">
                  <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl tracking-tight mb-6 text-background">
                    Experience the Collection
                  </h2>
                  <p className="text-background/70 leading-relaxed">
                    Discover pieces designed to become part of your story. Each one crafted with intention, built to last.
                  </p>
                </div>
              </Reveal>
              
              <Reveal delay={0.2}>
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-3 text-sm font-medium tracking-[0.2em] uppercase text-background hover:text-background/70 transition-colors duration-300"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-500 ease-premium" strokeWidth={1.5} />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
