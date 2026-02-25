/**
 * Simple in-memory sliding-window rate limiter.
 * Not suitable for multi-process / distributed deployments.
 * For production scale: replace with Upstash Redis rate limit.
 */

interface WindowEntry {
  count: number
  windowStart: number
}

const store = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 20

export function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now })
    return { ok: true, remaining: MAX_REQUESTS - 1 }
  }

  entry.count++
  const remaining = Math.max(0, MAX_REQUESTS - entry.count)
  return { ok: entry.count <= MAX_REQUESTS, remaining }
}
