"use client"

import { create } from "zustand"
import { useCartStore } from "@/store/cart"

export interface CustomerProfile {
  id: string
  email: string
  name: string | null
  phone: string | null
  address: unknown | null
  city: string | null
  state: string | null
  neighborhood: string | null
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

async function readJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const useCustomerAuth = create<CustomerAuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await fetch("/api/auth/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Login failed" }
    }

    set({ user: data.user, isAuthenticated: true, isLoading: false })
    await useCartStore.getState().mergeWithServerCart()
    return { success: true }
  },

  signup: async (email: string, password: string, name?: string) => {
    const response = await fetch("/api/auth/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", email, password, name }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Signup failed" }
    }
    set({ user: data.user, isAuthenticated: true, isLoading: false })
    return { success: true }
  },

  logout: async () => {
    await fetch("/api/auth/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    })
    useCartStore.getState().setAuthenticated(false)
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    try {
      const response = await fetch("/api/auth/customer", { method: "GET", cache: "no-store" })
      const data = await readJsonSafe(response)
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false })
        return
      }
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  updateProfile: async (profileData: Partial<CustomerProfile>) => {
    const response = await fetch("/api/auth/customer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateProfile", ...profileData }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Failed to update profile" }
    }
    if (data.user) {
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    }
    return { success: true }
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch("/api/auth/customer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updatePassword", currentPassword, newPassword }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Failed to update password" }
    }
    return { success: true }
  },

  updateEmail: async (newEmail: string, password: string) => {
    const response = await fetch("/api/auth/customer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateEmail", newEmail, password }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Failed to update email" }
    }
    if (data.user) {
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    }
    return { success: true }
  },
}))
