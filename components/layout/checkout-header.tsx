"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft, Lock } from "lucide-react"
import { premiumEasing } from "@/lib/motion"

export function CheckoutHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: premiumEasing }}
      className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
    >
      <nav className="mx-auto max-w-[1800px] px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Back to Cart */}
          <Link
            href="/shop"
            className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Continue Shopping</span>
          </Link>

          {/* Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-lg font-medium tracking-[0.3em] uppercase"
          >
            Atelier
          </Link>

          {/* Secure Checkout Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline tracking-[0.1em] uppercase">Secure Checkout</span>
          </div>
        </div>
      </nav>
    </motion.header>
  )
}
