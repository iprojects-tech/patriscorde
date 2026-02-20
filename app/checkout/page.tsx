"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Lock, CreditCard, Truck, Package, AlertCircle, RefreshCw, Loader2, Banknote, Building } from "lucide-react"
import { toast } from "sonner"
import { CheckoutHeader } from "@/components/layout/checkout-header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { premiumEasing } from "@/lib/motion"
import OrderConfirmation from "@/components/checkout/order-confirmation"
import { createConektaOxxoOrder, createConektaSpeiOrder } from "@/app/actions/conekta"
import { useCustomerAuth } from "@/store/customer-auth"

type CheckoutStep = "information" | "shipping" | "payment"

const steps: { id: CheckoutStep; label: string }[] = [
  { id: "information", label: "Information" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const getTotal = useCartStore((state) => state.getTotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const { user, isAuthenticated, checkAuth } = useCustomerAuth()
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [hasPrefilledFromAccount, setHasPrefilledFromAccount] = useState(false)
  
  // Form state
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [apartment, setApartment] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("Mexico")
  const [postalCode, setPostalCode] = useState("")
  const [phone, setPhone] = useState("")
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard")
  const [saveInfo, setSaveInfo] = useState(true)
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "transfer" | null>(null)
  const [selectedInstallments, setSelectedInstallments] = useState(0)

  // Card form state (local, not connected)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  // Cash store selection
  const [selectedCashStore, setSelectedCashStore] = useState<CashStore | null>(null)

  // OXXO state
  const [oxxoReference, setOxxoReference] = useState<string | null>(null)
  const [oxxoBarcodeUrl, setOxxoBarcodeUrl] = useState<string | null>(null)
  const [oxxoExpiresAt, setOxxoExpiresAt] = useState<string | null>(null)
  const [oxxoOrderNumber, setOxxoOrderNumber] = useState<string | null>(null)

  // SPEI state
  const [speiClabe, setSpeiClabe] = useState<string | null>(null)
  const [speiBank, setSpeiBank] = useState<string | null>(null)
  const [speiExpiresAt, setSpeiExpiresAt] = useState<string | null>(null)
  const [speiOrderNumber, setSpeiOrderNumber] = useState<string | null>(null)
  
  const subtotal = getTotal()
  const shipping = shippingMethod === "express" ? 25000 : shippingMethod === "standard" ? 12000 : 0
  const tax = Math.round(subtotal * 0.16)
  const total = subtotal + shipping + tax

  // MSI options based on amount (Conekta minimums)
  const msiOptions = (() => {
    const totalPesos = total / 100
    const options: { value: number; label: string }[] = [
      { value: 0, label: "Single payment" },
    ]
    if (totalPesos >= 300) options.push({ value: 3, label: "3 months interest-free" })
    if (totalPesos >= 600) options.push({ value: 6, label: "6 months interest-free" })
    if (totalPesos >= 900) options.push({ value: 9, label: "9 months interest-free" })
    if (totalPesos >= 1200) options.push({ value: 12, label: "12 months interest-free" })
    if (totalPesos >= 1800) options.push({ value: 18, label: "18 months interest-free (Citibanamex)" })
    if (totalPesos >= 2400) options.push({ value: 24, label: "24 months interest-free (BBVA, Banorte, Afirme)" })
    return options
  })()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated && user && !hasPrefilledFromAccount) {
      setEmail(user.email || "")
      if (user.name) {
        const nameParts = user.name.split(" ")
        setFirstName(nameParts[0] || "")
        setLastName(nameParts.slice(1).join(" ") || "")
      }
      setPhone(user.phone || "")
      setAddress(user.address || "")
      setCity(user.city || "")
      setCountry(user.country || "Mexico")
      setPostalCode(user.postal_code || "")
      setHasPrefilledFromAccount(true)
    }
  }, [isAuthenticated, user, hasPrefilledFromAccount])

  useEffect(() => {
    if (items.length === 0 && !isComplete && !oxxoReference && !speiClabe) {
      router.push("/shop")
    }
  }, [items, router, isComplete, oxxoReference, speiClabe])

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const validateInformationStep = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email")
      return false
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name")
      return false
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      toast.error("Please complete your shipping address")
      return false
    }
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return false
    }
    return true
  }

  const goToNextStep = () => {
    if (currentStep === "information" && !validateInformationStep()) return
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].id)
  }

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].id)
  }

  const handleSubmitOrder = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }
    if (paymentMethod === "card") {
      // Local form - not connected to Conekta yet
      toast.error("Card payments are coming soon. Please use OXXO or Bank Transfer.")
      return
    }

    setIsProcessing(true)
    setPaymentFailed(false)
    setErrorMessage("")

    try {
      const cartItems = items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku || item.product.id,
        price: item.product.price,
        quantity: item.quantity,
        image: typeof item.product.main_image === "string" ? item.product.main_image : undefined,
        size: item.variant?.size,
        color: item.variant?.color?.name,
      }))

      const shippingData = {
        name: `${firstName} ${lastName}`,
        address: address + (apartment ? `, ${apartment}` : ""),
        city,
        state: state || city,
        country,
        postalCode,
        phone: phone.replace(/\D/g, ""),
      }

      if (paymentMethod === "cash") {
        // OXXO cash payment
        const result = await createConektaOxxoOrder({
          items: cartItems,
          customerEmail: email,
          customerPhone: phone.replace(/\D/g, ""),
          customerName: `${firstName} ${lastName}`,
          shipping: shippingData,
          subtotal,
          shippingCost: shipping,
          tax,
          total,
        })

        if (result.error) {
          setIsProcessing(false)
          setPaymentFailed(true)
          setErrorMessage(result.error)
          toast.error(result.error)
          return
        }

        if (result.success) {
          setOxxoReference(result.reference || null)
          setOxxoBarcodeUrl(result.barcodeUrl || null)
          setOxxoExpiresAt(result.expiresAt || null)
          setOxxoOrderNumber(result.orderNumber || null)
          clearCart()
          setIsProcessing(false)
          return
        }
      } else if (paymentMethod === "transfer") {
        // SPEI bank transfer
        const result = await createConektaSpeiOrder({
          items: cartItems,
          customerEmail: email,
          customerPhone: phone.replace(/\D/g, ""),
          customerName: `${firstName} ${lastName}`,
          shipping: shippingData,
          subtotal,
          shippingCost: shipping,
          tax,
          total,
        })

        if (result.error) {
          setIsProcessing(false)
          setPaymentFailed(true)
          setErrorMessage(result.error)
          toast.error(result.error)
          return
        }

        if (result.success) {
          setSpeiClabe(result.clabe || null)
          setSpeiBank(result.bank || null)
          setSpeiExpiresAt(result.expiresAt || null)
          setSpeiOrderNumber(result.orderNumber || null)
          clearCart()
          setIsProcessing(false)
          return
        }
      }
    } catch (error) {
      setIsProcessing(false)
      setPaymentFailed(true)
      setErrorMessage("Something went wrong. Please try again.")
      toast.error("Payment error")
    }
  }

  const handleRetryPayment = () => {
    setPaymentFailed(false)
    setErrorMessage("")
  }

  // OXXO reference confirmation screen
  if (oxxoReference) {
    const expiryDate = oxxoExpiresAt ? new Date(oxxoExpiresAt) : null
    return (
      <div className="min-h-screen flex items-start justify-center pt-6">
        <div className="max-w-lg w-full px-6 py-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: premiumEasing, delay: 0.2 }}
            className="w-12 h-12 mx-auto mb-4 border-2 border-foreground flex items-center justify-center"
          >
            <Check className="h-5 w-5" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-serif text-2xl mb-1">Order Created</h1>
          <p className="text-sm text-muted-foreground">
            {selectedCashStore
              ? <>Pay in cash at <strong className="text-foreground">{selectedCashStore.name}</strong></>
              : "Pay in cash at any convenience store"
            }
            {oxxoOrderNumber && <span> &middot; Order #{oxxoOrderNumber}</span>}
          </p>

          <Separator className="my-5 bg-border" />

          <div className="text-left space-y-3">
            {/* Selected Store Logo */}
            {selectedCashStore && (
              <div className="border border-border p-3 flex items-center justify-center">
                {selectedCashStore.logo ? (
                  <div className="h-10 flex items-center justify-center">
                    <img
                      src={selectedCashStore.logo}
                      alt={selectedCashStore.name}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <span
                    className="w-10 h-10 rounded-sm flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: selectedCashStore.color }}
                  >
                    {selectedCashStore.letters}
                  </span>
                )}
              </div>
            )}

            {/* Reference + Barcode combined */}
            <div className="border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-[0.15em] uppercase">Payment Reference</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(oxxoReference)
                    toast.success("Reference copied")
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Copy
                </button>
              </div>
              <div className="bg-muted/30 p-3 text-center">
                <p className="font-mono text-lg tracking-[0.2em] font-bold select-all">
                  {oxxoReference}
                </p>
              </div>
              {oxxoBarcodeUrl && (
                <div className="mt-3 pt-3 border-t border-border text-center">
                  <img src={oxxoBarcodeUrl} alt="Cash payment barcode" className="mx-auto h-12 object-contain" />
                </div>
              )}
            </div>

            {/* Amount & Expiry */}
            <div className="border border-border p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium">{formatPrice(total)}</span>
              </div>
              {expiryDate && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm font-medium">
                    {expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              <Separator className="my-3 bg-border" />
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-2">How to pay</h3>
              <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                <li>Go to your nearest <strong className="text-foreground">{selectedCashStore?.name || "convenience store"}</strong></li>
                <li>Tell the cashier you want to make a <strong className="text-foreground">cash payment</strong></li>
                <li>Provide the reference number above</li>
                <li>Pay <strong className="text-foreground">{formatPrice(total)}</strong> in cash</li>
              </ol>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 text-xs">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                Payment confirms within 1-2 business days. Confirmation email will be sent to <strong className="text-foreground">{email}</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Link href="/shop" className="flex-1">
              <Button className="h-10 w-full bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/account" className="flex-1">
              <Button variant="outline" className="h-10 w-full text-xs font-medium tracking-[0.15em] uppercase">
                My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // SPEI confirmation screen
  if (speiClabe) {
    const expiryDate = speiExpiresAt ? new Date(speiExpiresAt) : null
    return (
      <div className="min-h-screen flex items-start justify-center pt-6">
        <div className="max-w-lg w-full px-6 py-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: premiumEasing, delay: 0.2 }}
            className="w-12 h-12 mx-auto mb-4 border-2 border-foreground flex items-center justify-center"
          >
            <Check className="h-5 w-5" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-serif text-2xl mb-1">Order Created</h1>
          <p className="text-sm text-muted-foreground">
            Transfer via SPEI to complete your payment
            {speiOrderNumber && <span> &middot; Order #{speiOrderNumber}</span>}
          </p>

          <Separator className="my-5 bg-border" />

          <div className="text-left space-y-3">
            {/* CLABE & Bank */}
            <div className="border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium tracking-[0.15em] uppercase">CLABE Number</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(speiClabe)
                    toast.success("CLABE copied")
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  Copy
                </button>
              </div>
              <div className="bg-muted/30 p-3 text-center">
                <p className="font-mono text-lg tracking-[0.15em] font-bold select-all">
                  {speiClabe}
                </p>
              </div>
              {speiBank && (
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bank</span>
                  <span className="text-sm font-medium">{speiBank}</span>
                </div>
              )}
            </div>

            {/* Amount & Expiry */}
            <div className="border border-border p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Exact amount to transfer</span>
                <span className="text-sm font-medium">{formatPrice(total)}</span>
              </div>
              {expiryDate && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm font-medium">
                    {expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              <Separator className="my-3 bg-border" />
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-2">How to pay</h3>
              <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                <li>Open your banking app or go to your bank website</li>
                <li>Select <strong className="text-foreground">SPEI transfer</strong></li>
                <li>Enter the CLABE number above as the destination</li>
                <li>Transfer exactly <strong className="text-foreground">{formatPrice(total)}</strong></li>
              </ol>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-3 bg-muted/30 text-xs">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                SPEI transfers are confirmed within minutes. Confirmation email will be sent to <strong className="text-foreground">{email}</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Link href="/shop" className="flex-1">
              <Button className="h-10 w-full bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/account" className="flex-1">
              <Button variant="outline" className="h-10 w-full text-xs font-medium tracking-[0.15em] uppercase">
                My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (paymentFailed) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-6 py-20 lg:py-32 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: premiumEasing, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-8 border-2 border-foreground flex items-center justify-center"
          >
            <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-serif text-4xl md:text-5xl mb-4">Payment Failed</h1>

          <p className="text-muted-foreground mb-2">We were unable to process your payment</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMessage}</p>

          <Separator className="my-10 bg-border" />

          <div className="text-left space-y-6 mb-10">
            <div className="border border-border p-5">
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase mb-3">What you can do</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>Verify your card details are correct</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>Make sure you have sufficient funds</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>Try with a different card</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                  <span>Contact your bank if the issue persists</span>
                </li>
              </ul>
            </div>
            
            <div className="flex items-start gap-4 p-5 bg-muted/30">
              <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Your cart is safe</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your items are still in your cart and no charges were made.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleRetryPayment}
              className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push("/shop")}
              variant="outline"
              className="h-12 px-8 border-foreground text-foreground hover:bg-foreground hover:text-background text-xs font-medium tracking-[0.15em] uppercase bg-transparent"
            >
              Back to Shop
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            {"Need help? "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return <OrderConfirmation />
  }

  if (items.length === 0) {
    return null
  }

  return (
  <>

      <CheckoutHeader />
      <main className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-12">
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Checkout</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr,420px] gap-16 lg:gap-24">
            {/* Left Column - Form */}
            <div>
              {/* Steps Indicator */}
              <div className="flex items-center gap-4 mb-12">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-4">
                    <button
                      onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                      disabled={index > currentStepIndex}
                      className={`flex items-center gap-3 transition-colors duration-300 ${
                        index <= currentStepIndex ? "text-foreground" : "text-muted-foreground/50"
                      } ${index < currentStepIndex ? "cursor-pointer hover:opacity-70" : ""}`}
                    >
                      <span
                        className={`w-7 h-7 flex items-center justify-center text-xs font-medium border transition-all duration-300 ${
                          index < currentStepIndex
                            ? "bg-foreground text-background border-foreground"
                            : index === currentStepIndex
                            ? "border-foreground"
                            : "border-border"
                        }`}
                      >
                        {index < currentStepIndex ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="text-xs font-medium tracking-wide uppercase hidden sm:block">
                        {step.label}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-8 sm:w-12 h-px transition-colors duration-300 ${
                          index < currentStepIndex ? "bg-foreground" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.4, ease: premiumEasing }}
                >
                  {currentStep === "information" && (
                    <InformationStep
                      email={email} setEmail={setEmail}
                      firstName={firstName} setFirstName={setFirstName}
                      lastName={lastName} setLastName={setLastName}
                      address={address} setAddress={setAddress}
                      apartment={apartment} setApartment={setApartment}
                      city={city} setCity={setCity}
                      state={state} setState={setState}
                      country={country} setCountry={setCountry}
                      postalCode={postalCode} setPostalCode={setPostalCode}
                      phone={phone} setPhone={setPhone}
                      saveInfo={saveInfo} setSaveInfo={setSaveInfo}
                      onContinue={goToNextStep}
                      isAuthenticated={isAuthenticated}
                      userEmail={user?.email}
                    />
                  )}

                  {currentStep === "shipping" && (
                    <ShippingStep
                      shippingMethod={shippingMethod}
                      setShippingMethod={setShippingMethod}
                      onBack={goToPrevStep}
                      onContinue={goToNextStep}
                    />
                  )}

                  {currentStep === "payment" && (
                    <PaymentStep
                      total={total}
                      isProcessing={isProcessing}
                      msiOptions={msiOptions}
                      selectedInstallments={selectedInstallments}
                      setSelectedInstallments={setSelectedInstallments}
                      paymentMethod={paymentMethod}
                      setPaymentMethod={setPaymentMethod}
                      cardNumber={cardNumber}
                      setCardNumber={setCardNumber}
                      cardName={cardName}
                      setCardName={setCardName}
                      cardExpiry={cardExpiry}
                      setCardExpiry={setCardExpiry}
                      cardCvv={cardCvv}
                      setCardCvv={setCardCvv}
                      selectedCashStore={selectedCashStore}
                      setSelectedCashStore={setSelectedCashStore}
                      onBack={goToPrevStep}
                      onSubmit={handleSubmitOrder}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:border-l lg:border-border lg:pl-12">
              <div className="lg:sticky lg:top-32">
                <h2 className="text-xs font-medium tracking-[0.15em] uppercase mb-8">
                  Order Summary
                </h2>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.variant?.size || ""}-${item.variant?.color?.name || ""}`} className="flex gap-4">
                      <div className="relative w-20 h-24 bg-muted flex-shrink-0 overflow-hidden">
                        <Image
                          src={typeof item.product.main_image === "string" ? item.product.main_image : "/placeholder.jpg"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.product.name}</h3>
                        {(item.variant?.color || item.variant?.size) && (
                          <div className="flex items-center gap-2 mt-1">
                            {item.variant?.color && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border border-border" style={{ backgroundColor: item.variant.color.value }} />
                                <span className="text-xs text-muted-foreground">{item.variant.color.name}</span>
                              </div>
                            )}
                            {item.variant?.color && item.variant?.size && <span className="text-xs text-muted-foreground">/</span>}
                            {item.variant?.size && <span className="text-xs text-muted-foreground">{item.variant.size}</span>}
                          </div>
                        )}
                        <p className="text-sm mt-2">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-8 bg-border" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{currentStep === "information" ? "Calculated next" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (IVA 16%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator className="my-6 bg-border" />

                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-xl font-serif">{formatPrice(total)}</span>
                </div>

                {selectedInstallments > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {selectedInstallments} pagos de <span className="font-medium text-foreground">{formatPrice(Math.round(total / selectedInstallments))}</span>/mes
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-4">Tax included</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ---- Information Step ----
function InformationStep({
  email, setEmail, firstName, setFirstName, lastName, setLastName,
  address, setAddress, apartment, setApartment, city, setCity,
  state, setState, country, setCountry, postalCode, setPostalCode,
  phone, setPhone, saveInfo, setSaveInfo, onContinue, isAuthenticated, userEmail,
}: {
  email: string; setEmail: (v: string) => void
  firstName: string; setFirstName: (v: string) => void
  lastName: string; setLastName: (v: string) => void
  address: string; setAddress: (v: string) => void
  apartment: string; setApartment: (v: string) => void
  city: string; setCity: (v: string) => void
  state: string; setState: (v: string) => void
  country: string; setCountry: (v: string) => void
  postalCode: string; setPostalCode: (v: string) => void
  phone: string; setPhone: (v: string) => void
  saveInfo: boolean; setSaveInfo: (v: boolean) => void
  onContinue: () => void
  isAuthenticated: boolean; userEmail?: string
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-2">Contact Information</h2>
        {isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            {"Logged in as "}<span className="text-foreground">{userEmail}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {"Already have an account? "}
            <Link href="/auth/login?redirect=/checkout" className="text-foreground underline underline-offset-4 hover:no-underline">
              Log in
            </Link>{" "}
            for a faster checkout.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com" disabled={isAuthenticated}
            className="h-12 border-border bg-transparent focus:border-foreground transition-colors disabled:opacity-60" />
        </div>
      </div>

      <Separator className="bg-border" />

      <div>
        <h2 className="font-serif text-2xl mb-2">Shipping Address</h2>
        <p className="text-sm text-muted-foreground">Where should we send your order?</p>
      </div>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs font-medium tracking-wide uppercase">First Name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs font-medium tracking-wide uppercase">Last Name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-xs font-medium tracking-wide uppercase">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Street and number" className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apartment" className="text-xs font-medium tracking-wide uppercase">Apartment / Suite (optional)</Label>
          <Input id="apartment" value={apartment} onChange={(e) => setApartment(e.target.value)}
            className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs font-medium tracking-wide uppercase">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)}
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-xs font-medium tracking-wide uppercase">State</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value)}
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-xs font-medium tracking-wide uppercase">Postal Code</Label>
            <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-medium tracking-wide uppercase">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="10 digits" required
              className="h-12 border-border bg-transparent focus:border-foreground transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Checkbox id="saveInfo" checked={saveInfo} onCheckedChange={(checked) => setSaveInfo(checked as boolean)}
            className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" />
          <Label htmlFor="saveInfo" className="text-sm text-muted-foreground cursor-pointer">
            Save this information for next time
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link href="/shop" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        <Button
          onClick={() => {
            if (!email || !firstName || !lastName || !address || !city || !postalCode || !phone) {
              toast.error("Please complete all required fields")
              return
            }
            const phoneDigits = phone.replace(/\D/g, "")
            if (phoneDigits.length < 10) {
              toast.error("Please enter a valid 10-digit phone number")
              return
            }
            onContinue()
          }}
          className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

// ---- Shipping Step ----
function ShippingStep({
  shippingMethod, setShippingMethod, onBack, onContinue,
}: {
  shippingMethod: string; setShippingMethod: (v: string) => void
  onBack: () => void; onContinue: () => void
}) {
  const shippingOptions = [
    { id: "standard", name: "Standard Shipping", description: "5-7 business days", price: 12000, icon: Package },
    { id: "express", name: "Express Shipping", description: "2-3 business days", price: 25000, icon: Truck },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-2">Shipping Method</h2>
        <p className="text-sm text-muted-foreground">Choose how you want to receive your order.</p>
      </div>

      <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-4">
        {shippingOptions.map((option) => (
          <label key={option.id} htmlFor={option.id}
            className={`flex items-center gap-4 p-5 border cursor-pointer transition-all duration-300 ${
              shippingMethod === option.id ? "border-foreground bg-muted/30" : "border-border hover:border-foreground/30"
            }`}
          >
            <RadioGroupItem value={option.id} id={option.id}
              className="border-border data-[state=checked]:border-foreground data-[state=checked]:text-foreground" />
            <option.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">{option.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
            </div>
            <span className="text-sm font-medium">{formatPrice(option.price)}</span>
          </label>
        ))}
      </RadioGroup>

      <div className="border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-muted flex items-center justify-center flex-shrink-0">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Secure Shipping</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              All orders ship with full tracking and insurance. You will receive email updates.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <Button onClick={onContinue}
          className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase">
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}

// ---- Card Brand Detection Helpers ----
function detectCardBrand(number: string): "visa" | "mastercard" | "amex" | null {
  const digits = number.replace(/\D/g, "")
  if (!digits) return null
  if (/^3[47]/.test(digits)) return "amex"
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard"
  if (/^4/.test(digits)) return "visa"
  return null
}

function CardBrandIcon({ brand }: { brand: "visa" | "mastercard" | "amex" | null }) {
  if (brand === "visa") return (
    <img src="/images/payments/visa.jpg" alt="Visa" className="h-6 w-auto object-contain" />
  )
  if (brand === "mastercard") return (
    <svg width="36" height="24" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="26" rx="3" fill="#252525"/>
      <circle cx="16" cy="13" r="7" fill="#EB001B"/>
      <circle cx="24" cy="13" r="7" fill="#F79E1B"/>
      <path d="M20 7.8C21.5 9 22.4 10.9 22.4 13C22.4 15.1 21.5 17 20 18.2C18.5 17 17.6 15.1 17.6 13C17.6 10.9 18.5 9 20 7.8Z" fill="#FF5F00"/>
    </svg>
  )
  if (brand === "amex") return (
    <img src="/images/payments/amex.svg" alt="American Express" className="h-6 w-auto object-contain" />
  )
  return <CreditCard className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
}

// ---- Cash Payment Store Logos ----
type CashStore = {
  name: string
  color: string
  letters: string
  logo?: string
}

const CASH_STORES: CashStore[] = [
  { name: "OXXO", color: "#CC0000", letters: "OXXO", logo: "/images/stores/oxxo.png" },
  { name: "7-Eleven", color: "#008348", letters: "7-11", logo: "/images/stores/7eleven.png" },
  { name: "Walmart", color: "#0071CE", letters: "WM", logo: "/images/stores/walmart.png" },
  { name: "Circle K", color: "#ED1C24", letters: "CK", logo: "/images/stores/circlek.png" },
  { name: "Farmacias del Ahorro", color: "#00A551", letters: "FA", logo: "/images/stores/farmacias-ahorro.png" },
  { name: "Bodega Aurrera", color: "#FFC220", letters: "BA", logo: "/images/stores/aurrera.png" },
  { name: "Sam's Club", color: "#0060A9", letters: "SC", logo: "/images/stores/sams-club.png" },
  { name: "Soriana", color: "#E31837", letters: "SOR", logo: "/images/stores/soriana.jpg" },
  { name: "Tiendas Extra", color: "#FF6600", letters: "EX", logo: "/images/stores/extra.png" },
  { name: "Farmacia Benavides", color: "#0072BC", letters: "FB", logo: "/images/stores/benavides.png" },
  { name: "Woolworth", color: "#B5121B", letters: "WW", logo: "/images/stores/woolworth.png" },
  { name: "Del Sol", color: "#FFD100", letters: "DS", logo: "/images/stores/delsol.png" },
  { name: "Waldo's", color: "#00A550", letters: "WD", logo: "/images/stores/waldos.png" },
  { name: "Super Kiosko", color: "#FF4E00", letters: "SK", logo: "/images/stores/kiosko.jpg" },
  { name: "Farmacias Bazar", color: "#1E3A8A", letters: "FBz", logo: "/images/stores/farmacias-bazar.png" },
  { name: "Yepas", color: "#E91E63", letters: "YP", logo: "/images/stores/yepas.png" },
  { name: "Farmacias De Dios", color: "#4CAF50", letters: "FD", logo: "/images/stores/de-dios.png" },
  { name: "Farmacias Nosarco", color: "#3F51B5", letters: "FN", logo: "/images/stores/nosarco.png" },
  { name: "Farmacias Santa Cruz", color: "#D32F2F", letters: "FSC", logo: "/images/stores/santa-cruz.png" },
  { name: "Farmacentro", color: "#009688", letters: "FC", logo: "/images/stores/farmacentro.png" },
  { name: "Farmacias GyM", color: "#673AB7", letters: "FG", logo: "/images/stores/gym.png" },
  { name: "Farmacias San Francisco de Asis", color: "#795548", letters: "SFA", logo: "/images/stores/san-francisco.png" },
  { name: "Farmacias Union", color: "#FF5722", letters: "FU", logo: "/images/stores/union.png" },
  { name: "Farmacias Zapotlan", color: "#607D8B", letters: "FZ", logo: "/images/stores/zapotlan.png" },
  { name: "Farmatodo", color: "#2196F3", letters: "FT", logo: "/images/stores/farmatodo.png" },
  { name: "Alsuper", color: "#8BC34A", letters: "AS", logo: "/images/stores/alsuper.jpg" },
  { name: "ELECZION", color: "#9C27B0", letters: "EL", logo: "/images/stores/eleczion.png" },
]

// SPEI Logo
function SpeiLogo({ className }: { className?: string }) {
  return (
    <img src="/images/payments/spei.png" alt="SPEI" className={className} style={{ objectFit: "contain" }} />
  )
}

// ---- Payment Step ----
function PaymentStep({
  total, isProcessing, msiOptions, selectedInstallments, setSelectedInstallments,
  paymentMethod, setPaymentMethod,
  cardNumber, setCardNumber, cardName, setCardName, cardExpiry, setCardExpiry, cardCvv, setCardCvv,
  selectedCashStore, setSelectedCashStore,
  onBack, onSubmit,
}: {
  total: number
  isProcessing: boolean
  msiOptions: { value: number; label: string }[]
  selectedInstallments: number
  setSelectedInstallments: (v: number) => void
  paymentMethod: "card" | "cash" | "transfer" | null
  setPaymentMethod: (v: "card" | "cash" | "transfer") => void
  cardNumber: string
  setCardNumber: (v: string) => void
  cardName: string
  setCardName: (v: string) => void
  cardExpiry: string
  setCardExpiry: (v: string) => void
  cardCvv: string
  setCardCvv: (v: string) => void
  selectedCashStore: CashStore | null
  setSelectedCashStore: (v: CashStore | null) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const detectedBrand = detectCardBrand(cardNumber)
  const isAmex = detectedBrand === "amex"
  const maxCardLength = isAmex ? 18 : 19 // Amex: 15 digits + 2 spaces, Others: 16 digits + 3 spaces
  const maxCvvLength = isAmex ? 4 : 3

  // Format card number with spaces
  const handleCardNumberChange = (value: string) => {
    const maxDigits = isAmex ? 15 : 16
    const digits = value.replace(/\D/g, "").slice(0, maxDigits)
    if (isAmex) {
      // Amex format: 4-6-5
      const parts = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean)
      setCardNumber(parts.join(" "))
    } else {
      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")
      setCardNumber(formatted)
    }
  }

  // Format expiry as MM/YY
  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`)
    } else {
      setCardExpiry(digits)
    }
  }

  // Top 4 stores to show as preview
  const previewStores = CASH_STORES.slice(0, 4)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-2">Payment</h2>
        <p className="text-sm text-muted-foreground">
          All transactions are secure and encrypted.
        </p>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-3">
        {/* Credit & Debit Cards */}
        <label
          htmlFor="method-card"
          className={`block border cursor-pointer transition-all duration-300 ${
            paymentMethod === "card" ? "border-foreground" : "border-border hover:border-foreground/30"
          }`}
        >
          <div className="flex items-center gap-4 p-5">
            <input
              type="radio"
              id="method-card"
              name="paymentMethod"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              paymentMethod === "card" ? "border-foreground" : "border-muted-foreground/40"
            }`}>
              {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-foreground" />}
            </div>
            <CreditCard className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">Credit & Debit Cards</p>
              <p className="text-xs text-muted-foreground mt-0.5">Up to 24 months interest-free</p>
            </div>
            <div className="flex items-center gap-2">
              <CardBrandIcon brand="visa" />
              <CardBrandIcon brand="mastercard" />
              <CardBrandIcon brand="amex" />
            </div>
          </div>

          {/* Local Card Form */}
          {paymentMethod === "card" && (
            <div className="border-t border-border px-5 pb-5 pt-4 bg-muted/10 space-y-4">
              <div>
                <Label htmlFor="cardNumber" className="text-xs font-medium tracking-wide uppercase">Card Number</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder={isAmex ? "3782 822463 10005" : "1234 5678 9012 3456"}
                    className="h-11 bg-background border-border font-mono tracking-wider pr-14"
                    maxLength={maxCardLength}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CardBrandIcon brand={detectedBrand} />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="cardName" className="text-xs font-medium tracking-wide uppercase">Name on Card</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                  className="h-11 mt-1.5 bg-background border-border uppercase"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="cardExpiry" className="text-xs font-medium tracking-wide uppercase">Expiry</Label>
                  <Input
                    id="cardExpiry"
                    value={cardExpiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    placeholder="MM/YY"
                    className="h-11 mt-1.5 bg-background border-border font-mono tracking-wider"
                    maxLength={5}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cardCvv" className="text-xs font-medium tracking-wide uppercase">{isAmex ? "CID" : "CVV"}</Label>
                  <Input
                    id="cardCvv"
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, maxCvvLength))}
                    placeholder={isAmex ? "1234" : "123"}
                    className="h-11 mt-1.5 bg-background border-border font-mono tracking-wider"
                    maxLength={maxCvvLength}
                  />
                </div>
              </div>

              {/* MSI Selection - only show for credit cards (assumed when card detected) */}
              {msiOptions.length > 1 && (
                <div className="border border-border p-4 bg-background mt-2">
                  <h3 className="text-sm font-medium mb-1">Months Interest-Free (MSI)</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Available with credit cards issued in Mexico
                  </p>
                  <RadioGroup
                    value={selectedInstallments.toString()}
                    onValueChange={(v) => setSelectedInstallments(parseInt(v))}
                    className="space-y-2"
                  >
                    {msiOptions.map((option) => (
                      <label key={option.value} htmlFor={`msi-${option.value}`}
                        className={`flex items-center gap-3 p-3 border cursor-pointer transition-all duration-300 ${
                          selectedInstallments === option.value ? "border-foreground bg-muted/30" : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <RadioGroupItem value={option.value.toString()} id={`msi-${option.value}`}
                          className="border-border data-[state=checked]:border-foreground data-[state=checked]:text-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{option.label}</p>
                          {option.value > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {option.value} payments of {formatPrice(Math.round(total / option.value))}
                            </p>
                          )}
                        </div>
                        {option.value === 0 && (
                          <span className="text-sm font-medium">{formatPrice(total)}</span>
                        )}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
        </label>

        {/* Cash */}
        <div
          className={`block border cursor-pointer transition-all duration-300 ${
            paymentMethod === "cash" ? "border-foreground" : "border-border hover:border-foreground/30"
          }`}
        >
          <div
            className="flex items-center gap-4 p-5"
            onClick={() => setPaymentMethod("cash")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setPaymentMethod("cash") }}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              paymentMethod === "cash" ? "border-foreground" : "border-muted-foreground/40"
            }`}>
              {paymentMethod === "cash" && <div className="w-2 h-2 rounded-full bg-foreground" />}
            </div>
            <Banknote className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">Cash</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pay at any convenience store</p>
            </div>
                    <div className="flex items-center gap-1.5">
                      {previewStores.map((store) => (
                        <span
                          key={store.name}
                          className="w-7 h-5 rounded-sm flex items-center justify-center overflow-hidden bg-background border border-border"
                          title={store.name}
                        >
                          {store.logo ? (
                            <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                          ) : (
                            <span
                              className="w-full h-full flex items-center justify-center text-white text-[6px] font-bold"
                              style={{ backgroundColor: store.color }}
                            >
                              {store.letters}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
          </div>

          {paymentMethod === "cash" && (
            <div className="border-t border-border px-5 pb-5 pt-4 bg-muted/10">
              <p className="text-xs font-medium tracking-[0.15em] uppercase mb-3 text-muted-foreground">
                Select a store to pay at
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                {CASH_STORES.map((store) => (
                  <button
                    key={store.name}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedCashStore(store)
                    }}
                    className={`flex items-center justify-center p-1 border transition-all duration-200 h-11 ${
                      selectedCashStore?.name === store.name
                        ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                        : "border-border bg-background hover:border-foreground/40 hover:bg-muted/20"
                    }`}
                    title={store.name}
                  >
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="max-w-full max-h-8 object-contain"
                      />
                    ) : (
                      <span
                        className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-[7px] font-bold"
                        style={{ backgroundColor: store.color }}
                      >
                        {store.letters}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedCashStore && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-foreground" />
                  <span>Pay at <strong className="text-foreground">{selectedCashStore.name}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bank Transfer (SPEI) */}
        <label
          htmlFor="method-transfer"
          className={`block border cursor-pointer transition-all duration-300 ${
            paymentMethod === "transfer" ? "border-foreground" : "border-border hover:border-foreground/30"
          }`}
        >
          <div className="flex items-center gap-4 p-5">
            <input
              type="radio"
              id="method-transfer"
              name="paymentMethod"
              checked={paymentMethod === "transfer"}
              onChange={() => setPaymentMethod("transfer")}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              paymentMethod === "transfer" ? "border-foreground" : "border-muted-foreground/40"
            }`}>
              {paymentMethod === "transfer" && <div className="w-2 h-2 rounded-full bg-foreground" />}
            </div>
            <Building className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-medium">Bank Transfer (SPEI)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Transfer from your bank account</p>
            </div>
            <SpeiLogo className="w-14 h-6" />
          </div>

          {paymentMethod === "transfer" && (
            <div className="border-t border-border px-5 pb-5 pt-4 bg-muted/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">How it works</p>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Complete your order and receive a CLABE number</li>
                    <li>Transfer the exact amount via SPEI from your bank</li>
                    <li>Payment is confirmed automatically within minutes</li>
                    <li>Your order ships once payment is confirmed</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-4 p-5 bg-muted/30">
        <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">100% Secure Payment</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Your data is securely processed by Conekta, PCI DSS Level 1 certified.
            We never store your card details.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border mt-6">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 order-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <Button
          onClick={onSubmit}
          disabled={isProcessing || !paymentMethod || (paymentMethod === "cash" && !selectedCashStore)}
          className="h-14 px-10 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium tracking-[0.15em] uppercase w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Lock className="h-4 w-4" />
              Pay {formatPrice(total)}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}