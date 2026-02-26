import { create } from "zustand"
import type { Product, CartItem, CartState, SelectedVariant } from "@/lib/directus/types"

const variantsMatch = (v1?: SelectedVariant, v2?: SelectedVariant): boolean => {
  if (!v1 && !v2) return true
  if (!v1 || !v2) return false
  return v1.size === v2.size && v1.color?.name === v2.color?.name
}

interface ExtendedCartState extends CartState {
  isSyncing: boolean
  isAuthenticated: boolean
  setAuthenticated: (auth: boolean) => void
  syncCartToServer: () => Promise<void>
  loadCartFromServer: () => Promise<void>
  mergeWithServerCart: () => Promise<void>
  initializeCart: () => Promise<void>
}

async function fetchServerCart() {
  const response = await fetch("/api/cart", { method: "GET", cache: "no-store" })
  if (!response.ok) return []
  const data = await response.json()
  return (data?.cart || []) as CartItem[]
}

async function saveServerCart(items: CartItem[]) {
  await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart: items }),
  })
}

export const useCartStore = create<ExtendedCartState>()((set, get) => ({
  items: [],
  isSyncing: false,
  isAuthenticated: false,

  setAuthenticated: (auth: boolean) => {
    set({ isAuthenticated: auth })
    if (!auth) set({ items: [] })
  },

  initializeCart: async () => {
    try {
      const authResponse = await fetch("/api/auth/customer", { method: "GET", cache: "no-store" })
      const authData = await authResponse.json()
      if (authData?.user) {
        set({ isAuthenticated: true })
        await get().loadCartFromServer()
      } else {
        set({ isAuthenticated: false, items: [] })
      }
    } catch {
      set({ isAuthenticated: false, items: [] })
    }
  },

  addItem: (product: Product, quantity = 1, variant?: SelectedVariant) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id && variantsMatch(item.variant, variant),
      )

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id && variantsMatch(item.variant, variant)
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        }
      }

      return {
        items: [...state.items, { product, quantity, variant }],
      }
    })
    get().syncCartToServer()
  },

  removeItem: (productId: string, variant?: SelectedVariant) => {
    set((state) => ({
      items: state.items.filter((item) => !(item.product.id === productId && variantsMatch(item.variant, variant))),
    }))
    get().syncCartToServer()
  },

  updateQuantity: (productId: string, quantity: number, variant?: SelectedVariant) => {
    if (quantity < 1) {
      get().removeItem(productId, variant)
      return
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId && variantsMatch(item.variant, variant) ? { ...item, quantity } : item,
      ),
    }))
    get().syncCartToServer()
  },

  clearCart: () => {
    set({ items: [] })
    get().syncCartToServer()
  },

  getTotal: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),

  syncCartToServer: async () => {
    try {
      const authResponse = await fetch("/api/auth/customer", { method: "GET", cache: "no-store" })
      const authData = await authResponse.json()
      if (!authData?.user) return
      await saveServerCart(get().items)
    } catch (error) {
      console.error("Failed to sync cart to server:", error)
    }
  },

  loadCartFromServer: async () => {
    set({ isSyncing: true })
    try {
      const serverItems = await fetchServerCart()
      set({ items: serverItems })
    } catch (error) {
      console.error("Failed to load cart from server:", error)
    } finally {
      set({ isSyncing: false })
    }
  },

  mergeWithServerCart: async () => {
    set({ isSyncing: true })
    try {
      const serverItems = await fetchServerCart()
      const localItems = get().items
      const mergedItems = [...serverItems]

      for (const localItem of localItems) {
        const existingIndex = mergedItems.findIndex(
          (item) => item.product.id === localItem.product.id && variantsMatch(item.variant, localItem.variant),
        )
        if (existingIndex >= 0) {
          mergedItems[existingIndex].quantity += localItem.quantity
        } else {
          mergedItems.push(localItem)
        }
      }

      set({ items: mergedItems })
      await saveServerCart(mergedItems)
    } catch (error) {
      console.error("Failed to merge carts:", error)
    } finally {
      set({ isSyncing: false })
    }
  },
}))

export const useCartItems = () => useCartStore((state) => state.items)
export const useCartTotal = () => useCartStore((state) => state.getTotal())
export const useCartItemCount = () => useCartStore((state) => state.getItemCount())
