import { NextResponse } from "next/server"

interface SepomexZipCode {
  d_estado?: string | null
  d_mnpio?: string | null
  d_ciudad?: string | null
  d_asenta?: string | null
}

interface SepomexResponse {
  zip_codes?: SepomexZipCode[]
  meta?: {
    pagination?: {
      links?: {
        next?: string | null
      }
    }
  }
}

interface LocationRecord {
  state: string
  city: string
  neighborhood: string
}

async function fetchPage(url: string): Promise<SepomexResponse> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) return {}
  return (await response.json()) as SepomexResponse
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postalCode = String(searchParams.get("postalCode") || "").replace(/\D/g, "").slice(0, 5)

  if (postalCode.length !== 5) {
    return NextResponse.json({ cities: [] }, { status: 200 })
  }

  try {
    const seen = new Set<string>()
    const records: LocationRecord[] = []

    let nextUrl: string | null = `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${postalCode}`
    let pageCount = 0

    while (nextUrl && pageCount < 10) {
      const payload = await fetchPage(nextUrl)
      for (const item of payload.zip_codes || []) {
        const state = String(item.d_estado || "").trim()
        const city = String(item.d_mnpio || item.d_ciudad || "").trim()
        const neighborhood = String(item.d_asenta || "").trim()
        if (!state || !city || !neighborhood) continue

        const key = `${state}|${city}|${neighborhood}`
        if (seen.has(key)) continue
        seen.add(key)
        records.push({ state, city, neighborhood })
      }

      const next = payload.meta?.pagination?.links?.next || null
      nextUrl = next ? `https://sepomex.icalialabs.com${next}` : null
      pageCount += 1
    }

    const states = Array.from(new Set(records.map((item) => item.state)))
    const cities = Array.from(new Set(records.map((item) => item.city)))
    const neighborhoods = Array.from(
      new Set(
        records.map((item) => item.neighborhood),
      ),
    )

    return NextResponse.json({ locations: records, states, cities, neighborhoods }, { status: 200 })
  } catch {
    return NextResponse.json({ locations: [], states: [], cities: [], neighborhoods: [] }, { status: 200 })
  }
}
