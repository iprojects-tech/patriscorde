"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { premiumEasing } from "@/lib/motion"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: premiumEasing }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: premiumEasing }}
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-8"
        >
          <Mail className="h-7 w-7 text-foreground" strokeWidth={1.5} />
        </motion.div>

        <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Almost There
        </p>
        <h1 className="font-serif text-4xl tracking-tight mb-4">
          Check your email
        </h1>
        <p className="text-muted-foreground mb-8">
          We've sent you a confirmation link. Please check your inbox and click the link to activate your account.
        </p>

        <div className="space-y-4">
          <Button asChild className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase">
            <Link href="/auth/login">
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full h-12 text-xs font-medium tracking-[0.15em] uppercase bg-transparent">
            <Link href="/">
              Continue Shopping
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Didn't receive an email? Check your spam folder or{" "}
          <Link href="/auth/signup" className="underline underline-offset-4 hover:no-underline">
            try again
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
