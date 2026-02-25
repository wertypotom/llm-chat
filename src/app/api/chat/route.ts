import { llmProvider, DEFAULT_MODEL, SYSTEM_PROMPT } from '@/shared/lib/llm'
import { getZapierMCPClient, getAI_SDKTools } from '@/shared/lib/mcp-client'
import { z } from 'zod'
import { streamText, stepCountIs } from 'ai'
import type { ModelMessage } from 'ai'

// Allow long multi-step Abacus calls (each LLM step can take 20-50s)
export const maxDuration = 300

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    let tools = {}
    try {
      const client = await getZapierMCPClient()
      // Extract last user message — used as Zapier instructions fallback context
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

    return result.toTextStreamResponse()
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[/api/chat]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
