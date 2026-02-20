"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getClipPublicKey } from "@/app/actions/clip"

// Unique ID for the card container
const CARD_CONTAINER_ID = "clip-card-checkout"

interface ClipCardFormProps {
  onTokenGenerated: (token: string) => void
  onError: (error: string) => void
  isProcessing: boolean
}

export function ClipCardForm({ onTokenGenerated, onError, isProcessing }: ClipCardFormProps) {
  const [cardInstance, setCardInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  // Fetch public key from server
  useEffect(() => {
    getClipPublicKey().then((key) => {
      setPublicKey(key)
    })
  }, [])

  useEffect(() => {
    if (!publicKey) return

    // Load Clip SDK script
    const script = document.createElement("script")
    script.src = "https://sdk.clip.mx/js/clip-sdk.js"
    script.async = true
    
    script.onload = () => {
      initializeClip()
    }
    
    script.onerror = () => {
      setSdkError("Error al cargar el SDK de pagos")
      setIsLoading(false)
    }
    
    document.body.appendChild(script)
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [publicKey])

  const initializeClip = () => {
    try {
      const ClipSDK = (window as any).ClipSDK
      
      if (!ClipSDK) {
        setSdkError("SDK de pagos no disponible")
        setIsLoading(false)
        return
      }

      if (!publicKey) {
        setSdkError("Configuración de pagos incompleta")
        setIsLoading(false)
        return
      }

      // Initialize ClipSDK with the API key
      const clip = new ClipSDK(publicKey)
      
      // Create a "Card" element with locale set to Spanish
      const card = clip.element.create("Card", {
        locale: "es",
      })
      
      // Mount the card to the container using the ID
      card.mount(CARD_CONTAINER_ID)
      
      setCardInstance(card)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error initializing Clip:", err)
      setSdkError("Error al inicializar el formulario de pago")
      setIsLoading(false)
    }
  }

  // Expose tokenize function using card.cardToken()
  const tokenize = async (): Promise<string | null> => {
    if (!cardInstance) {
      onError("El formulario de pago no está listo")
      return null
    }

    try {
      // Use card.cardToken() to get the token
      const cardToken = await cardInstance.cardToken()
      
      if (cardToken && cardToken.id) {
        onTokenGenerated(cardToken.id)
        return cardToken.id
      }
      
      onError("No se pudo obtener el token de la tarjeta")
      return null
    } catch (err: any) {
      // Handle specific Clip error codes
      switch (err.code) {
        case "CL2200":
        case "CL2290":
          onError(err.message || "Error en los datos de la tarjeta")
          break
        case "AI1300":
          onError("Error de conexión. Intenta de nuevo.")
          break
        default:
          onError(err.message || "Error al procesar la tarjeta")
      }
      return null
    }
  }

  // Expose the tokenize function to parent
  useEffect(() => {
    if (cardInstance) {
      (window as any).__clipTokenize = tokenize
    }
    return () => {
      delete (window as any).__clipTokenize
    }
  }, [cardInstance])

  if (sdkError) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-600 text-sm rounded-none">
        {sdkError}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando formulario de pago...</span>
        </div>
      )}
      
      {/* Container for Clip card iframe - uses ID for mounting */}
      <div 
        id={CARD_CONTAINER_ID}
        className={`min-h-[200px] transition-opacity ${isLoading ? "opacity-0 h-0 overflow-hidden" : "opacity-100"} ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      />
      
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Tus datos están protegidos con encriptación de nivel bancario
      </p>
    </div>
  )
}

// Helper function to trigger tokenization from outside
export async function triggerClipTokenization(): Promise<string | null> {
  if (typeof window !== "undefined" && (window as any).__clipTokenize) {
    return await (window as any).__clipTokenize()
  }
  return null
}
