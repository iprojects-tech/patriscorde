import { Pool, type QueryResult } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var __atelierPgPool: Pool | undefined
}

function getConnectionString() {
  const value = process.env.DATABASE_URL
  if (!value) {
    throw new Error("DATABASE_URL is not configured")
  }
  return value
}

function createPool() {
  const connectionString = getConnectionString()
  const isLocal = /localhost|127\.0\.0\.1/i.test(connectionString)
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  })
}

export const pgPool = global.__atelierPgPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  global.__atelierPgPool = pgPool
}

export async function pgQuery<T = unknown>(text: string, values?: unknown[]): Promise<QueryResult<T>> {
  return pgPool.query<T>(text, values)
}
