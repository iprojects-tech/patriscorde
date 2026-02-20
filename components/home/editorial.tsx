"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { premiumEasing } from "@/lib/motion"

export function Editorial() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50])
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 })
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 })

  return (
    <section ref={containerRef} className="py-24 lg:py-32 bg-background overflow-hidden">
      <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Images */}
          <div className="relative h-[600px] lg:h-[700px]">
            <motion.div
              style={{ y: smoothY1 }}
              className="absolute top-0 left-0 w-[65%] h-[70%] z-10"
            >
              <div className="relative w-full h-full bg-muted overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
                  alt="Editorial image 1"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              style={{ y: smoothY2 }}
              className="absolute bottom-0 right-0 w-[55%] h-[55%] z-20"
            >
              <div className="relative w-full h-full bg-muted overflow-hidden border-8 border-background">
                <img
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80"
                  alt="Editorial image 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
                Our Philosophy
              </p>
            </Reveal>
            
            <Reveal delay={0.1}>
              <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-8 leading-[1.1]">
                Designed for the
                <br />
                unhurried life
              </h2>
            </Reveal>
            
            <Reveal delay={0.2}>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-6 max-w-lg">
                We believe in the power of restraint. Each piece in our collection 
                is designed with intention, crafted from exceptional materials, 
                and built to transcend seasons.
              </p>
            </Reveal>
            
            <Reveal delay={0.3}>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                Our approach is simple: fewer, better things. Pieces that age 
                gracefully and become more beautiful with time. A wardrobe that 
                reflects considered choices.
              </p>
            </Reveal>
            
            <Reveal delay={0.4}>
              <Button
                asChild
                variant="outline"
                className="h-12 px-8 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-500 ease-premium group bg-transparent"
              >
                <Link href="/about">
                  <span className="text-xs font-medium tracking-[0.15em] uppercase">
                    Our Story
                  </span>
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 ease-premium group-hover:translate-x-1" strokeWidth={1.5} />
                </Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
