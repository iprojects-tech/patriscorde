"use client"

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "staff"
  avatar?: string
  createdAt: string
  lastLogin?: string
}

interface AdminAuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
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
      // Check if user is an admin (try both id and auth_user_id for compatibility)
      let { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle()
      
      // Fallback to auth_user_id if not found by id
      if (!adminData) {
        const result = await supabase
          .from("admin_users")
          .select("*")
          .eq("auth_user_id", data.user.id)
          .maybeSingle()
        adminData = result.data
        adminError = result.error
      }

      if (adminError || !adminData) {
        await supabase.auth.signOut()
        return { success: false, error: "You do not have admin access" }
      }

      set({
        user: {
          id: adminData.id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          createdAt: adminData.created_at,
          lastLogin: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    }

    return { success: false, error: "Login failed" }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Try both id and auth_user_id for compatibility
      let { data: adminData } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      
      if (!adminData) {
        const result = await supabase
          .from("admin_users")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle()
        adminData = result.data
      }

      if (adminData) {
        set({
          user: {
            id: adminData.id,
            email: adminData.email,
            name: adminData.name,
            role: adminData.role,
            createdAt: adminData.created_at,
            lastLogin: new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }
    }
    
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

// Mock admin users for user management display (used in admin settings)
export const getMockAdminUsers = (): AdminUser[] => [
  {
    id: "admin-1",
    email: "admin@atelier.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01",
  },
]
