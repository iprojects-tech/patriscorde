"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { premiumEasing } from "@/lib/motion"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsSubmitted(true)
    setEmail("")
  }

  return (
    <section className="py-24 lg:py-32 bg-foreground text-background">
      <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-background/60 mb-6">
              Stay Connected
            </p>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight mb-6">
              Join our world
            </h2>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className="text-base text-background/70 mb-10 leading-relaxed">
              Be the first to discover new arrivals, exclusive offers, 
              and stories from our atelier. Unsubscribe anytime.
            </p>
          </Reveal>
          
          <Reveal delay={0.3}>
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: premiumEasing }}
                className="flex items-center justify-center gap-3 text-background"
              >
                <div className="w-8 h-8 rounded-full border border-background/30 flex items-center justify-center">
                  <Check className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <span className="text-sm">Thank you for subscribing</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-14 px-6 bg-transparent border border-background/30 text-background placeholder:text-background/40 text-sm focus:outline-none focus:border-background transition-colors duration-300"
                  required
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 px-8 bg-background text-foreground hover:bg-background/90 text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
