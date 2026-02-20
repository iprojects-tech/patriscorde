"use client"

import React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Package, Settings, LogOut, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useCustomerAuth } from "@/store/customer-auth"
import { premiumEasing } from "@/lib/motion"
import { toast } from "sonner"

const accountNav = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/settings", label: "Settings", icon: Settings },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useCustomerAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/account")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    await logout()
    toast.success("Signed out successfully")
    router.push("/")
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        {/* Header */}
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: premiumEasing }}
            >
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
                My Account
              </p>
              <h1 className="font-serif text-3xl lg:text-4xl tracking-tight">
                {user?.name || "Welcome"}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {user?.email}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: premiumEasing }}
                className="lg:col-span-1"
              >
                <nav className="space-y-1">
                  {accountNav.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          isActive
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" strokeWidth={1.5} />
                        {item.label}
                      </Link>
                    )
                  })}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </nav>
              </motion.aside>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: premiumEasing }}
                className="lg:col-span-3"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
