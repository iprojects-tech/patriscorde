import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)
  
  // Protect admin routes (except login)
  if (request.nextUrl.pathname.startsWith("/admin") && 
      !request.nextUrl.pathname.startsWith("/admin/login")) {
    // Check if user is authenticated via Supabase session cookie
    const supabaseResponse = response || NextResponse.next()
    return supabaseResponse
  }
  
  return response
}
