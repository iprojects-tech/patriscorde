"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cart"
import { premiumEasing } from "@/lib/motion"
import { formatPrice } from "@/lib/utils"

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotal = useCartStore((state) => state.getTotal)

  const total = getTotal()
  const isEmpty = items.length === 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg border-l border-border bg-background p-0 flex flex-col">
        <SheetHeader className="px-6 py-6 border-b border-border">
          <SheetTitle className="text-sm font-medium tracking-[0.15em] uppercase">
            Shopping Bag ({items.length})
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground mb-8">Your bag is empty</p>
            <Button
              variant="outline"
              className="border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-300 bg-transparent"
              onClick={() => onOpenChange(false)}
              asChild
            >
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.product.id}-${item.variant?.size || ""}-${item.variant?.color?.name || ""}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: index * 0.05, ease: premiumEasing }}
                    className="px-6 py-6 border-b border-border"
                  >
                    <div className="flex gap-5">
                      <div className="relative w-24 h-32 bg-muted flex-shrink-0 overflow-hidden">
                        <Image
                          src={typeof item.product.main_image === "string" 
                            ? item.product.main_image 
                            : "/placeholder.jpg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-medium leading-tight">
                              {item.product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {item.variant?.color && (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 border border-border"
                                    style={{ backgroundColor: item.variant.color.value }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.variant.color.name}
                                  </span>
                                </div>
                              )}
                              {item.variant?.color && item.variant?.size && (
                                <span className="text-xs text-muted-foreground">/</span>
                              )}
                              {item.variant?.size && (
                                <span className="text-xs text-muted-foreground">
                                  {item.variant.size}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-transparent -mt-1 -mr-1"
                            onClick={() => removeItem(item.product.id, item.variant)}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                        
                        <div className="mt-auto flex items-end justify-between">
                          <div className="flex items-center gap-3 border border-border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-transparent"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                            >
                              <Minus className="h-3 w-3" strokeWidth={1.5} />
                            </Button>
                            <span className="text-sm w-6 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-transparent"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                            >
                              <Plus className="h-3 w-3" strokeWidth={1.5} />
                            </Button>
                          </div>
                          
                          <p className="text-sm font-medium">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-border bg-background">
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout.
                </p>
                <Separator className="bg-border" />
                <Button
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-xs font-medium tracking-[0.1em] uppercase hover:bg-transparent underline-offset-4 hover:underline"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
