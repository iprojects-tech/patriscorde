import { create } from "zustand"
import type { Product, CartItem, CartState, SelectedVariant } from "@/lib/directus/types"
import { createClient } from "@/lib/supabase/client"
import createJSONStorage from "zustand/middleware/createJSONStorage"

// Helper to check if two variants match
const variantsMatch = (v1?: SelectedVariant, v2?: SelectedVariant): boolean => {
  if (!v1 && !v2) return true
  if (!v1 || !v2) return false
  return v1.size === v2.size && v1.color?.name === v2.color?.name
}

// Extended cart state with sync capabilities
interface ExtendedCartState extends CartState {
  isSyncing: boolean
  isAuthenticated: boolean
  setAuthenticated: (auth: boolean) => void
  syncCartToServer: () => Promise<void>
  loadCartFromServer: () => Promise<void>
  mergeWithServerCart: () => Promise<void>
  initializeCart: () => Promise<void>
}

export const useCartStore = create<ExtendedCartState>()(
  (set, get) => ({
    items: [],
    isSyncing: false,
    isAuthenticated: false,
    
    setAuthenticated: (auth: boolean) => {
      set({ isAuthenticated: auth })
      if (!auth) {
        // Clear cart when user logs out
        set({ items: [] })
      }
    },
    
    // Initialize cart - check auth and load from server if logged in
    initializeCart: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        set({ isAuthenticated: true })
        await get().loadCartFromServer()
      } else {
        set({ isAuthenticated: false, items: [] })
      }
    },
      
      addItem: (product: Product, quantity = 1, variant?: SelectedVariant) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && variantsMatch(item.variant, variant)
          )
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id && variantsMatch(item.variant, variant)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { product, quantity, variant }],
          }
        })
        // Sync to server after adding item
        get().syncCartToServer()
      },
      
      removeItem: (productId: string, variant?: SelectedVariant) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product.id === productId && variantsMatch(item.variant, variant))
          ),
        }))
        // Sync to server after removing item
        get().syncCartToServer()
      },
      
      updateQuantity: (productId: string, quantity: number, variant?: SelectedVariant) => {
        if (quantity < 1) {
          get().removeItem(productId, variant)
          return
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && variantsMatch(item.variant, variant)
              ? { ...item, quantity }
              : item
          ),
        }))
        // Sync to server after updating quantity
        get().syncCartToServer()
      },
      
      clearCart: () => {
        set({ items: [] })
        // Sync empty cart to server
        get().syncCartToServer()
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        )
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },

      // Sync current cart to server
      syncCartToServer: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return // Only sync for logged-in users
        
        const items = get().items
        
        try {
          // Upsert cart data
          await supabase
            .from("saved_carts")
            .upsert({
              auth_user_id: user.id,
              cart_data: items,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "auth_user_id",
            })
        } catch (error) {
          console.error("Failed to sync cart to server:", error)
        }
      },

      // Load cart from server (replaces local cart)
      loadCartFromServer: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        set({ isSyncing: true })
        
        try {
          const { data } = await supabase
            .from("saved_carts")
            .select("cart_data")
            .eq("auth_user_id", user.id)
            .maybeSingle()
          
          if (data) {
            set({ items: data.cart_data as CartItem[] })
          }
        } catch (error) {
          console.error("Failed to load cart from server:", error)
        } finally {
          set({ isSyncing: false })
        }
      },

      // Merge local cart with server cart (used on login)
      mergeWithServerCart: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        set({ isSyncing: true })
        
        try {
          const { data } = await supabase
            .from("saved_carts")
            .select("cart_data")
            .eq("auth_user_id", user.id)
            .maybeSingle()
          
          const localItems = get().items
          const serverItems = (data?.cart_data as CartItem[]) || []
          
          // Merge: add local items to server items, combining quantities for duplicates
          const mergedItems = [...serverItems]
          
          for (const localItem of localItems) {
            const existingIndex = mergedItems.findIndex(
              (item) => item.product.id === localItem.product.id && 
                variantsMatch(item.variant, localItem.variant)
            )
            
            if (existingIndex >= 0) {
              // Add quantities together
              mergedItems[existingIndex].quantity += localItem.quantity
            } else {
              // Add new item
              mergedItems.push(localItem)
            }
          }
          
          set({ items: mergedItems })
          
          // Save merged cart to server
          await supabase
            .from("saved_carts")
            .upsert({
              auth_user_id: user.id,
              cart_data: mergedItems,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "auth_user_id",
            })
} catch (error) {
        console.error("Failed to merge carts:", error)
      } finally {
        set({ isSyncing: false })
      }
    },
  })
)

// Selectors for optimized re-renders
export const useCartItems = () => useCartStore((state) => state.items)
export const useCartTotal = () => useCartStore((state) => state.getTotal())
export const useCartItemCount = () => useCartStore((state) => state.getItemCount())
