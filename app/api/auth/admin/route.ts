import { NextResponse } from "next/server"
import { clearSessionCookie, getSessionFromCookies, setSessionCookie } from "@/lib/session"
import { pgQuery } from "@/lib/postgres"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const result = await pgQuery<any>("SELECT * FROM public.admin_users WHERE id = $1 OR auth_user_id = $1 LIMIT 1", [session.userId])
  const admin = result.rows[0]
  if (!admin) return NextResponse.json({ user: null }, { status: 200 })

  return NextResponse.json({
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.created_at,
      lastLogin: new Date().toISOString(),
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

      const result = await pgQuery<any>("SELECT * FROM public.admin_users WHERE lower(email) = $1 LIMIT 1", [email])
      const admin = result.rows[0]
      if (!admin) {
        return NextResponse.json({ success: false, error: "You do not have admin access" }, { status: 403 })
      }

      if (!admin.password_hash) {
        return NextResponse.json(
          { success: false, error: "Admin password not configured. Run auth hardening migration." },
          { status: 401 },
        )
      }
      const isValidPassword = await bcrypt.compare(password, admin.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
      }

      const response = NextResponse.json({
        success: true,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          createdAt: admin.created_at,
          lastLogin: new Date().toISOString(),
        },
      })
      setSessionCookie(response, {
        role: "admin",
        userId: admin.id,
        email: admin.email,
        name: admin.name,
      })
      return response
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin auth POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
