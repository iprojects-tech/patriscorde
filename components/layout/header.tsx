"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ShoppingBag, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from "@/store/cart"
import { useCustomerAuth } from "@/store/customer-auth"
import { CartSheet } from "@/components/cart/cart-sheet"
import { SearchDialog } from "@/components/search/search-dialog"
import { premiumEasing } from "@/lib/motion"

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
]

export function Header() {
  const [isMounted, setIsMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const initializeCart = useCartStore((state) => state.initializeCart)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useCustomerAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    checkAuth()
    initializeCart()
  }, [checkAuth, initializeCart])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: premiumEasing }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-premium ${
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto max-w-[1800px] px-6 lg:px-12">
          <div className="flex h-20 items-center justify-between">
            {/* Mobile Menu */}
            <div className="lg:hidden">
              {isMounted ? (
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-transparent"
                    >
                      <Menu className="h-5 w-5" strokeWidth={1.5} />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full max-w-sm border-r border-border bg-background p-0">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-6 border-b border-border">
                        <Link
                          href="/"
                          className="text-lg font-medium tracking-[0.3em] uppercase"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Atelier
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 hover:bg-transparent"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <X className="h-5 w-5" strokeWidth={1.5} />
                        </Button>
                      </div>
                      <nav className="flex-1 p-6">
                        <ul className="space-y-6">
                          {navLinks.map((link, index) => (
                            <motion.li
                              key={link.href}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, ease: premiumEasing }}
                            >
                              <Link
                                href={link.href}
                                className="block text-2xl font-serif tracking-wide text-foreground/80 hover:text-foreground transition-colors duration-300"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {link.label}
                              </Link>
                            </motion.li>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-transparent"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                  <span className="sr-only">Open menu</span>
                </Button>
              )}
            </div>

            {/* Desktop Nav Left */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium tracking-[0.15em] uppercase text-foreground/70 hover:text-foreground transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 ease-premium group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Logo */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 text-lg font-medium tracking-[0.3em] uppercase"
            >
              Atelier
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-transparent hidden sm:flex"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
                <span className="sr-only">Search</span>
              </Button>

              {/* Account */}
              {!isLoading && (
                isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-transparent"
                      >
                        <User className="h-5 w-5" strokeWidth={1.5} />
                        <span className="sr-only">Account</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium truncate">{user?.name || "My Account"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/account">Account Overview</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders">Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 hover:bg-transparent"
                    asChild
                  >
                    <Link href="/auth/login">
                      <User className="h-5 w-5" strokeWidth={1.5} />
                      <span className="sr-only">Sign In</span>
                    </Link>
                  </Button>
                )
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-transparent relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="sr-only">Cart</span>
              </Button>
            </div>
          </div>
        </nav>
      </motion.header>

      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
