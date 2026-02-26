"use client"

import { create } from "zustand"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "manager"
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

async function readJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await readJsonSafe(response)
    if (!response.ok || !data?.success) {
      return { success: false, error: data?.error || "Login failed" }
    }

    set({ user: data.user, isAuthenticated: true, isLoading: false })
    return { success: true }
  },

  logout: async () => {
    await fetch("/api/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    })
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    try {
      const response = await fetch("/api/auth/admin", { method: "GET", cache: "no-store" })
      const data = await readJsonSafe(response)
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false })
        return
      }
    } catch {}

    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))

export const getMockAdminUsers = (): AdminUser[] => [
  {
    id: "admin-1",
    email: "admin@atelier.com",
    name: "Admin User",
    role: "admin",
    createdAt: "2024-01-01",
  },
]
