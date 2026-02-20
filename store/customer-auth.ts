"use client"

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/store/cart"

export interface CustomerProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  postal_code: string | null
  created_at: string
}

interface CustomerAuthState {
  user: CustomerProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<CustomerProfile>) => Promise<{ success: boolean; error?: string }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>
}

export const useCustomerAuth = create<CustomerAuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      // Get or create customer profile
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("auth_user_id", data.user.id)
        .single()

      if (customerError && customerError.code !== "PGRST116") {
        return { success: false, error: "Failed to load profile" }
      }

      if (customerData) {
        set({
          user: {
            id: customerData.id,
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address,
            city: customerData.city,
            country: customerData.country,
            postal_code: customerData.postal_code,
            created_at: customerData.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Create customer profile if doesn't exist
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert({
            auth_user_id: data.user.id,
            email: data.user.email!,
          })
          .select()
          .single()

        if (createError) {
          return { success: false, error: "Failed to create profile" }
        }

        set({
          user: {
            id: newCustomer.id,
            email: newCustomer.email,
            name: newCustomer.name,
            phone: newCustomer.phone,
            address: newCustomer.address,
            city: newCustomer.city,
            country: newCustomer.country,
            postal_code: newCustomer.postal_code,
            created_at: newCustomer.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        })
      }

      // Merge local cart with server cart
      await useCartStore.getState().mergeWithServerCart()

      return { success: true }
    }

    return { success: false, error: "Login failed" }
  },

  signup: async (email: string, password: string, name?: string) => {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${typeof window !== "undefined" ? window.location.origin : ""}/account`,
        data: {
          name,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      // Customer profile is created automatically by database trigger
      return { success: true }
    }

    return { success: false, error: "Signup failed" }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear cart when logging out
    useCartStore.getState().setAuthenticated(false)
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if this is an admin user - if so, don't authenticate as customer
      const { data: adminData } = await supabase
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (adminData) {
        // This is an admin, not a customer
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("auth_user_id", user.id)
        .single()

      if (customerData) {
        set({
          user: {
            id: customerData.id,
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address,
            city: customerData.city,
            country: customerData.country,
            postal_code: customerData.postal_code,
            created_at: customerData.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }
    }
    
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  updateProfile: async (data: Partial<CustomerProfile>) => {
    const supabase = createClient()
    const { user } = get()
    
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("customers")
      .update({
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        postal_code: data.postal_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    set({
      user: {
        ...user,
        ...data,
      },
    })

    return { success: true }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const supabase = createClient()
    const { user } = get()
    
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  updateEmail: async (newEmail: string, password: string) => {
    const supabase = createClient()
    const { user } = get()
    
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    })

    if (signInError) {
      return { success: false, error: "Password is incorrect" }
    }

    // Update email in auth
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update email in customers table
    await supabase
      .from("customers")
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    set({
      user: {
        ...user,
        email: newEmail,
      },
    })

    return { success: true }
  },
}))
