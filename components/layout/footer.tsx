"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Best Sellers", href: "/shop?filter=best" },
  ],
  about: [
    { label: "Our Story", href: "/about" },
    { label: "Craftsmanship", href: "/about#craft" },
    { label: "Sustainability", href: "/about#sustainability" },
  ],
  support: [
    { label: "Contact", href: "/contact" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-[1800px] px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link
                href="/"
                className="inline-block text-lg font-medium tracking-[0.3em] uppercase mb-6"
              >
                Atelier
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                A refined selection of timeless pieces. Quiet luxury, considered design, 
                and exceptional quality for the discerning individual.
              </p>
            </div>

            {/* Links */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-6 text-foreground">
                    Shop
                  </h3>
                  <ul className="space-y-4">
                    {footerLinks.shop.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-6 text-foreground">
                    About
                  </h3>
                  <ul className="space-y-4">
                    {footerLinks.about.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-6 text-foreground">
                    Support
                  </h3>
                  <ul className="space-y-4">
                    {footerLinks.support.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Bottom */}
        <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/admin" 
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
            title="Admin"
          >
            {new Date().getFullYear()} Atelier. All rights reserved.
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
