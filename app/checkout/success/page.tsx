"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Package, ArrowRight, Clock, Banknote, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Reveal } from "@/components/motion/reveal"
import { useCartStore } from "@/store/cart"
import { premiumEasing } from "@/lib/motion"
import { getLatestOrderInfo } from "@/app/actions/orders"

function SuccessContent() {
  const searchParams = useSearchParams()
  const paymentMethodParam = searchParams.get("method") // card, cash, transfer
  const clearCart = useCartStore((state) => state.clearCart)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(paymentMethodParam)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart()

    // Fetch the latest order info from Supabase
    setIsLoading(true)
    getLatestOrderInfo().then((result) => {
      if (result.orderNumber) {
        setOrderNumber(result.orderNumber)
        setOrderStatus(result.status)
        if (result.paymentMethod && !paymentMethodParam) {
          setPaymentMethod(result.paymentMethod)
        }
      }
      setIsLoading(false)
    })
  }, [clearCart, paymentMethodParam])

  const isPending = orderStatus === "pending" || paymentMethod === "cash" || paymentMethod === "transfer"

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-20 lg:py-32 text-center">
        <Reveal>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: premiumEasing, delay: 0.2 }}
            className={`w-20 h-20 mx-auto mb-8 flex items-center justify-center ${
              isPending ? "bg-amber-500 text-white" : "bg-foreground text-background"
            }`}
          >
            {isPending ? (
              <Clock className="h-10 w-10" strokeWidth={1.5} />
            ) : (
              <Check className="h-10 w-10" strokeWidth={1.5} />
            )}
          </motion.div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">
            {isPending ? "Pedido registrado" : "Gracias"}
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-muted-foreground mb-2">
            {isPending 
              ? "Tu pedido está pendiente de pago"
              : "Tu pago ha sido confirmado"
            }
          </p>
          <p className="text-sm text-muted-foreground">
            Número de orden: <span className="font-medium text-foreground">{orderNumber}</span>
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <Separator className="my-10 bg-border" />
        </Reveal>

        <Reveal delay={0.4}>
          <div className="text-left space-y-6 mb-10">
            {/* Cash payment instructions */}
            {paymentMethod === "cash" && (
              <div className="flex items-start gap-4 p-5 border border-amber-200 bg-amber-50">
                <Banknote className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-amber-800">Completa tu pago en efectivo</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Te enviamos el código de pago a tu correo. Preséntalo en OXXO, 7-Eleven o tiendas participantes.
                    <strong className="block mt-2">Tienes 48 horas para completar el pago.</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Transfer payment instructions */}
            {paymentMethod === "transfer" && (
              <div className="flex items-start gap-4 p-5 border border-blue-200 bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-blue-800">Completa tu transferencia SPEI</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Te enviamos los datos bancarios a tu correo. Realiza la transferencia desde tu banca en línea.
                    <strong className="block mt-2">El pago se confirma en minutos.</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation email */}
            <div className="flex items-start gap-4 p-5 border border-border">
              <Package className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium">Correo de confirmación enviado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Te hemos enviado los detalles de tu pedido a tu correo electrónico
                </p>
              </div>
            </div>

            <div className="p-5 bg-muted/30">
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-3">
                {isPending ? "Siguientes pasos" : "¿Qué sigue?"}
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {isPending ? (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-amber-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                      <span>Completa el pago siguiendo las instrucciones en tu correo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                      <span>Recibirás confirmación cuando se verifique tu pago</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                      <span>Tu pedido se enviará una vez confirmado el pago</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-foreground text-background flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                      <span>Estamos preparando tu pedido para envío</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                      <span>Recibirás el número de rastreo por correo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                      <span>Tiempo estimado de entrega: 3-5 días hábiles</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="h-12 px-8 text-xs font-medium tracking-[0.15em] uppercase">
              <Link href="/shop">
                Seguir comprando
                <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.6}>
          <p className="text-xs text-muted-foreground mt-8">
            ¿Tienes preguntas sobre tu pedido?{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Contáctanos
            </Link>
          </p>
        </Reveal>
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
