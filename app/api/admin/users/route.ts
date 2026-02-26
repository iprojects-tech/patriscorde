import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/lib/session"
import { pgQuery } from "@/lib/postgres"
import bcrypt from "bcryptjs"

async function verifyAdmin() {
  const session = await getSessionFromCookies()
  return session?.role === "admin"
}

export async function GET() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await pgQuery(
    "SELECT id, auth_user_id, name, email, role, created_at FROM public.admin_users ORDER BY created_at DESC",
  )
  return NextResponse.json({ users: result.rows })
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, name, role, password } = await request.json()

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(String(password), 12)

    const result = await pgQuery(
      `INSERT INTO public.admin_users (email, name, role, password_hash, password_updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, auth_user_id, name, email, role, created_at`,
      [String(email).toLowerCase(), name, role, passwordHash],
    )

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get("id")
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    await pgQuery("DELETE FROM public.admin_users WHERE id = $1 OR auth_user_id = $1", [userId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting admin user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, role } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    await pgQuery(
      `UPDATE public.admin_users
       SET
         name = COALESCE($2, name),
         role = COALESCE($3, role)
       WHERE id = $1 OR auth_user_id = $1`,
      [id, name ?? null, role ?? null],
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating admin user:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
