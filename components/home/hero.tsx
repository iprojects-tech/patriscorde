"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { premiumEasing } from "@/lib/motion"

export function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 })
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 })

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ scale: smoothScale }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background z-10" />
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
          alt="Editorial fashion"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-20 h-full flex flex-col justify-end pb-24 lg:pb-32"
        style={{ y: smoothY, opacity: smoothOpacity }}
      >
        <div className="mx-auto max-w-[1800px] w-full px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.2, ease: premiumEasing }}
              className="text-xs font-medium tracking-[0.3em] uppercase text-foreground/70 mb-6"
            >
              Spring / Summer Collection
            </motion.p>
            
            <motion.h1
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.4, ease: premiumEasing }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight mb-8"
            >
              Quiet luxury,
              <br />
              considered design
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.6, ease: premiumEasing }}
              className="text-base lg:text-lg text-foreground/70 max-w-md mb-10 leading-relaxed"
            >
              A refined selection of timeless pieces for the discerning individual. 
              Exceptional quality, enduring style.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.8, ease: premiumEasing }}
            >
              <Button
                asChild
                variant="outline"
                className="h-14 px-10 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-500 ease-premium group bg-transparent"
              >
                <Link href="/shop">
                  <span className="text-xs font-medium tracking-[0.15em] uppercase">
                    Explore Collection
                  </span>
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform duration-500 ease-premium group-hover:translate-x-1" strokeWidth={1.5} />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 bg-foreground/30"
        />
      </motion.div>
    </section>
  )
}
