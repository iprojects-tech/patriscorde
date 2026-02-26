import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export type SessionRole = "customer" | "admin"

export interface AppSession {
  role: SessionRole
  userId: string
  email: string
  name?: string | null
  exp: number
  iat: number
}

const SESSION_COOKIE = "atelier_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

function getSecret() {
  return process.env.SESSION_SECRET || "atelier-dev-secret-change-me"
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url")
}

function sign(value: string) {
  return base64url(createHmac("sha256", getSecret()).update(value).digest())
}

export function encodeSession(payload: Omit<AppSession, "iat" | "exp">, ttlSeconds = SESSION_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000)
  const session: AppSession = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  }
  const body = base64url(JSON.stringify(session))
  const signature = sign(body)
  return `${body}.${signature}`
}

export function decodeSession(token: string | undefined | null): AppSession | null {
  if (!token) return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const expected = sign(body)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppSession
    const now = Math.floor(Date.now() / 1000)
    if (!parsed.exp || parsed.exp < now) return null
    return parsed
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  const store = await cookies()
  return decodeSession(store.get(SESSION_COOKIE)?.value)
}

export function setSessionCookie(response: NextResponse, payload: Omit<AppSession, "iat" | "exp">) {
  response.cookies.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}
