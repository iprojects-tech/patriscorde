"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Package } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Reveal } from "@/components/motion/reveal"
import { premiumEasing } from "@/lib/motion"

export default function OrderConfirmation() {
  const orderNumber = `ATL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-6 py-20 lg:py-32 text-center">
          <Reveal>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: premiumEasing, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-8 bg-foreground text-background flex items-center justify-center"
            >
              <Check className="h-8 w-8" strokeWidth={1.5} />
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Thank You</h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-muted-foreground mb-2">Your order has been confirmed</p>
            <p className="text-sm text-muted-foreground">
              Order number: <span className="text-foreground font-medium">{orderNumber}</span>
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <Separator className="my-10 bg-border" />
          </Reveal>

          <Reveal delay={0.4}>
            <div className="text-left space-y-6 mb-10">
              <div>
                <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-2">
                  What happens next?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You&apos;ll receive an email confirmation with your order details shortly.
                  Once your order ships, we&apos;ll send you tracking information.
                </p>
              </div>

              <div className="flex items-start gap-4 p-5 border border-border">
                <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Estimated delivery</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase"
              >
                <Link href="/shop">Continue Shopping</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 px-8 border-foreground text-foreground hover:bg-foreground hover:text-background text-xs font-medium tracking-[0.15em] uppercase bg-transparent"
              >
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </>
  )
}
