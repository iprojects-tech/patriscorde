"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAdminAuth } from "@/store/admin-auth"
import { premiumEasing } from "@/lib/motion"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Package, adminOnly: false },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen, adminOnly: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, adminOnly: false },
  { href: "/admin/users", label: "Users", icon: UserCog, adminOnly: true },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout, checkAuth } = useAdminAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Skip auth check for login page
  const isLoginPage = pathname === "/admin/login"

  // Check auth status on mount
  useEffect(() => {
    if (!isLoginPage) {
      checkAuth()
    }
  }, [isLoginPage, checkAuth])

  // Redirect to login if not authenticated (after loading)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, isLoading, isLoginPage, router])

  // Show only the login page content without the layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Show loading while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        <Link href="/admin">
          <span className="text-xs font-medium tracking-[0.2em] uppercase">Atelier</span>
        </Link>
        <div className="w-10" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-40 flex-col">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link href="/admin">
              <span className="text-xs font-medium tracking-[0.2em] uppercase">Atelier</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => !item.adminOnly || user?.role === "admin")
              .map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200
                      ${isActive 
                        ? "bg-foreground text-background" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : "-100%",
        }}
        transition={{ duration: 0.3, ease: premiumEasing }}
        className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-50"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href="/admin">
              <span className="text-xs font-medium tracking-[0.2em] uppercase">Atelier</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => !item.adminOnly || user?.role === "admin")
              .map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-200
                      ${isActive 
                        ? "bg-foreground text-background" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
          </nav>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {/* Page Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
