import { z } from 'zod'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { runMultiAgent } from '@/shared/lib/multi-agent'
import { DEFAULT_MODEL_ID } from '@/shared/lib/models'

export const maxDuration = 300

const requestSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  model: z.string().optional(),
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
    const { query, model } = requestSchema.parse(body)

    console.log(`[MultiAgent API] Query: "${query.slice(0, 80)}..."`)
    const result = await runMultiAgent(query, model || DEFAULT_MODEL_ID)
    console.log(`[MultiAgent API] Complete. ${result.agentMessages.length} agent messages.`)

    return Response.json(result, { status: 200 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[MultiAgent API]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
