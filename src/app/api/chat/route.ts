import { llmProvider, DEFAULT_MODEL, SYSTEM_PROMPT } from '@/shared/lib/llm'
import { getZapierMCPClient, getAI_SDKTools } from '@/shared/lib/mcp-client'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { z } from 'zod'
import { streamText, stepCountIs } from 'ai'
import type { ModelMessage } from 'ai'

// Allow long multi-step Abacus calls (each LLM step can take 20-50s)
export const maxDuration = 300

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
})

export async function POST(req: Request) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { ok, remaining } = checkRateLimit(ip)
  if (!ok) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } },
    )
  }

  try {
    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    let tools = {}
    try {
      const client = await getZapierMCPClient()
      const lastUserMsg = [...messages].reverse().find((m) => m['role'] === 'user')
      const userIntent = (lastUserMsg?.['content'] as string) ?? ''
      tools = await getAI_SDKTools(client, userIntent)
    } catch (e) {
      console.error('Failed to initialize MCP tools:', e)
    }

    const result = await streamText({
      model: llmProvider(DEFAULT_MODEL),
      system: SYSTEM_PROMPT,
      messages: messages as ModelMessage[],
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(3),
    })

    return result.toTextStreamResponse({
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[/api/chat]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
