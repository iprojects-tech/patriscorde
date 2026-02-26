import { NextResponse } from "next/server"
import { clearSessionCookie, getSessionFromCookies, setSessionCookie } from "@/lib/session"
import { pgQuery } from "@/lib/postgres"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "customer") {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const userResult = await pgQuery<any>("SELECT * FROM public.customers WHERE id = $1 LIMIT 1", [session.userId])
  const user = userResult.rows[0]
  if (!user) return NextResponse.json({ user: null }, { status: 200 })

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      neighborhood: user.neighborhood,
      country: user.country,
      postal_code: user.postal_code,
      created_at: user.created_at,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = body?.action as string

    if (action === "logout") {
      const response = NextResponse.json({ success: true })
      clearSessionCookie(response)
      return response
    }

    if (action === "login") {
      const email = String(body?.email || "").trim().toLowerCase()
      const password = String(body?.password || "")
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
      }

      const result = await pgQuery<any>(
        "SELECT * FROM public.customers WHERE lower(email) = $1 LIMIT 1",
        [email],
      )
      const customer = result.rows[0]
      if (!customer) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
      }

      if (!customer.password_hash) {
        return NextResponse.json(
          { success: false, error: "Account migrated without password. Create a new account to continue." },
          { status: 401 },
        )
      }

      const isValidPassword = await bcrypt.compare(password, customer.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
      }

      const response = NextResponse.json({
        success: true,
        user: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          neighborhood: customer.neighborhood,
          country: customer.country,
          postal_code: customer.postal_code,
          created_at: customer.created_at,
        },
      })
      setSessionCookie(response, {
        role: "customer",
        userId: customer.id,
        email: customer.email,
        name: customer.name,
      })
      return response
    }

    if (action === "signup") {
      const email = String(body?.email || "").trim().toLowerCase()
      const password = String(body?.password || "")
      const name = body?.name ? String(body.name) : null
      if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
      if (!password || password.length < 6) {
        return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
      }

      const existing = await pgQuery<any>("SELECT * FROM public.customers WHERE lower(email) = $1 LIMIT 1", [email])
      if (existing.rows[0]) {
        return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const created = await pgQuery<any>(
        "INSERT INTO public.customers (email, name, password_hash, password_updated_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
        [email, name, passwordHash],
      )
      const customer = created.rows[0]

      const response = NextResponse.json({
        success: true,
        user: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          neighborhood: customer.neighborhood,
          country: customer.country,
          postal_code: customer.postal_code,
          created_at: customer.created_at,
        },
      })
      setSessionCookie(response, {
        role: "customer",
        userId: customer.id,
        email: customer.email,
        name: customer.name,
      })
      return response
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Customer auth POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "customer") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const action = body?.action as string

    if (action === "updateProfile") {
      const result = await pgQuery<any>(
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
          session.userId,
          body?.name ?? null,
          body?.phone ?? null,
          body?.address ?? null,
          body?.city ?? null,
          body?.state ?? null,
          body?.neighborhood ?? null,
          body?.country ?? null,
          body?.postal_code ?? null,
        ],
      )
      return NextResponse.json({ success: true, user: result.rows[0] ?? null })
    }

    if (action === "updateEmail") {
      const newEmail = String(body?.newEmail || "").trim().toLowerCase()
      const password = String(body?.password || "")
      if (!newEmail) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
      if (!password) return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 })

      const current = await pgQuery<any>("SELECT id, password_hash FROM public.customers WHERE id = $1 LIMIT 1", [session.userId])
      const customerCurrent = current.rows[0]
      if (!customerCurrent?.password_hash) {
        return NextResponse.json({ success: false, error: "Password is not configured for this account" }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(password, customerCurrent.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Password is incorrect" }, { status: 401 })
      }

      const result = await pgQuery<any>(
        "UPDATE public.customers SET email = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
        [session.userId, newEmail],
      )
      const customer = result.rows[0]
      if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })

      const response = NextResponse.json({ success: true, user: customer })
      setSessionCookie(response, {
        role: "customer",
        userId: customer.id,
        email: customer.email,
        name: customer.name,
      })
      return response
    }

    if (action === "updatePassword") {
      const currentPassword = String(body?.currentPassword || "")
      const newPassword = String(body?.newPassword || "")
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: "Current and new password are required" }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: "New password must be at least 6 characters" }, { status: 400 })
      }

      const current = await pgQuery<any>("SELECT id, password_hash FROM public.customers WHERE id = $1 LIMIT 1", [session.userId])
      const customerCurrent = current.rows[0]
      if (!customerCurrent?.password_hash) {
        return NextResponse.json({ success: false, error: "Password is not configured for this account" }, { status: 400 })
      }
      const isValidPassword = await bcrypt.compare(currentPassword, customerCurrent.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 })
      }

      const newHash = await bcrypt.hash(newPassword, 12)
      await pgQuery(
        "UPDATE public.customers SET password_hash = $2, password_updated_at = NOW(), updated_at = NOW() WHERE id = $1",
        [session.userId, newHash],
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Customer auth PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
