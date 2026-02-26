import { pgQuery } from "@/lib/postgres"
import type { Customer } from "./types"

export async function getCustomers(options?: {
  limit?: number
  offset?: number
  search?: string
}) {
  const values: unknown[] = []
  const clauses: string[] = []

  if (options?.search) {
    values.push(`%${options.search}%`)
    clauses.push(`(email ILIKE $${values.length} OR name ILIKE $${values.length})`)
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""
  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0
  values.push(limit, offset)

  const result = await pgQuery<Customer>(
    `SELECT * FROM public.customers ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  )
  return result.rows
}

export async function getCustomerById(id: string) {
  const result = await pgQuery<Customer>("SELECT * FROM public.customers WHERE id = $1 LIMIT 1", [id])
  return result.rows[0] ?? null
}

export async function getCustomerByEmail(email: string) {
  const result = await pgQuery<Customer>("SELECT * FROM public.customers WHERE email = $1 LIMIT 1", [email])
  return result.rows[0] ?? null
}

export async function createCustomer(customer: {
  email: string
  name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  neighborhood?: string
  country?: string
  postal_code?: string
  auth_user_id?: string
}) {
  const result = await pgQuery<Customer>(
    `INSERT INTO public.customers
      (email, name, phone, address, city, state, neighborhood, country, postal_code, auth_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      customer.email,
      customer.name ?? null,
      customer.phone ?? null,
      customer.address ?? null,
      customer.city ?? null,
      customer.state ?? null,
      customer.neighborhood ?? null,
      customer.country ?? null,
      customer.postal_code ?? null,
      customer.auth_user_id ?? null,
    ],
  )
  return result.rows[0] ?? null
}

export async function updateCustomer(
  id: string,
  updates: Partial<{
    name: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    neighborhood: string | null
    country: string | null
    postal_code: string | null
  }>,
) {
  const result = await pgQuery<Customer>(
    `UPDATE public.customers
     SET
       name = COALESCE($2, name),
       phone = COALESCE($3, phone),
       address = COALESCE(to_jsonb($4::text), address),
       city = COALESCE($5, city),
       state = COALESCE($6, state),
       neighborhood = COALESCE($7, neighborhood),
       country = COALESCE($8, country),
       postal_code = COALESCE($9, postal_code),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      updates.name ?? null,
      updates.phone ?? null,
      updates.address ?? null,
      updates.city ?? null,
      updates.state ?? null,
      updates.neighborhood ?? null,
      updates.country ?? null,
      updates.postal_code ?? null,
    ],
  )
  return result.rows[0] ?? null
}

export async function getCustomersCount() {
  const result = await pgQuery<{ count: string }>("SELECT COUNT(*)::text AS count FROM public.customers")
  return Number(result.rows[0]?.count ?? 0)
}

export async function getOrCreateCustomer(
  email: string,
  data?: {
    name?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    neighborhood?: string
    country?: string
    postal_code?: string
  },
) {
  const existing = await getCustomerByEmail(email)
  if (existing) return existing
  return createCustomer({ email, ...data })
}
