import { z } from 'zod'
import { checkRateLimit } from '@/shared/lib/rate-limit'

export const maxDuration = 300

const AUTOGEN_URL = process.env.AUTOGEN_SERVER_URL || 'http://localhost:8100'

const requestSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  maxRounds: z.number().int().min(2).max(20).optional(),
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { ok } = checkRateLimit(ip)
  if (!ok) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  try {
    const body = await req.json()
    const { query, maxRounds } = requestSchema.parse(body)

    console.log(`[MultiAgent API] Proxying to AutoGen: "${query.slice(0, 80)}..."`)

    const res = await fetch(`${AUTOGEN_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_rounds: maxRounds ?? 8 }),
    })

    if (!res.ok) {
      const text = await res.text()
      try {
        console.error('[MultiAgent API] AutoGen error:', text)
      } catch {
        /* ignore */
      }
      return Response.json({ error: 'AutoGen server error' }, { status: 502 })
    }

    console.log(`[MultiAgent API] Starting SSE stream proxy...`)

    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    if (err instanceof TypeError && (err as NodeJS.ErrnoException).cause) {
      return Response.json(
        { error: 'AutoGen server not reachable. Make sure it is running on port 8100.' },
        { status: 503 },
      )
    }
    console.error('[MultiAgent API]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
