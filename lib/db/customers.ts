import { createClient } from "@/lib/supabase/server"
import type { Customer } from "./types"

export async function getCustomers(options?: {
  limit?: number
  offset?: number
  search?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,name.ilike.%${options.search}%`)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching customers:", error)
    return []
  }
  
  return data as Customer[]
}

export async function getCustomerById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching customer:", error)
    return null
  }
  
  return data as Customer
}

export async function getCustomerByEmail(email: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("email", email)
    .single()
  
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching customer by email:", error)
    return null
  }
  
  return data as Customer | null
}

export async function createCustomer(customer: {
  email: string
  name?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  auth_user_id?: string
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single()
  
  if (error) {
    console.error("Error creating customer:", error)
    return null
  }
  
  return data as Customer
}

export async function updateCustomer(id: string, updates: Partial<{
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  postal_code: string | null
}>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("customers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating customer:", error)
    return null
  }
  
  return data as Customer
}

export async function getCustomersCount() {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
  
  if (error) {
    console.error("Error counting customers:", error)
    return 0
  }
  
  return count || 0
}

export async function getOrCreateCustomer(email: string, data?: {
  name?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
}) {
  // Check if customer exists
  const existing = await getCustomerByEmail(email)
  if (existing) {
    return existing
  }
  
  // Create new customer
  return createCustomer({
    email,
    ...data,
  })
}
