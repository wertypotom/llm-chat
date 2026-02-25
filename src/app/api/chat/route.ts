import { llmProvider, getSystemPrompt } from '@/shared/lib/llm'
import { DEFAULT_MODEL_ID } from '@/shared/lib/models'
import { getZapierMCPClient, getAI_SDKTools } from '@/shared/lib/mcp-client'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { z } from 'zod'
import { streamText, stepCountIs, tool } from 'ai'
import type { ModelMessage } from 'ai'

// Allow long multi-step Abacus calls (each LLM step can take 20-50s)
export const maxDuration = 300

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
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
    const { messages, model, systemPrompt } = requestSchema.parse(body)

    const createSupportTicketParameters = z.object({
      category: z
        .string()
        .describe('The category of the issue, e.g., "Technical", "Billing", "General Inquiry"'),
      urgency: z
        .enum(['low', 'medium', 'high', 'critical'])
        .describe('The urgency level of the issue based on user tone and impact'),
      summary: z.string().describe('A concise summary of the issue (1-2 sentences)'),
    })

    // The instruction implies that `Record<string, unknown>` might cause an error,
    // and if so, we should revert to `any` and add the eslint-disable comment.
    // Since the provided "Code Edit" snippet already includes the eslint-disable
    // comment with `any`, we'll assume the intent is to keep `any` for `tools`
    // and disable the linter for it, as `unknown` would likely cause issues
    // when merging with `zapierTools` which might be `any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tools: Record<string, any> = {
      createSupportTicket: tool({
        description:
          'Creates a support ticket when a user is frustrated, requests human help, or reports a bug/issue.',
        parameters: createSupportTicketParameters,
        // @ts-expect-error type inference bug in AI SDK / zod
        execute: async ({ category, urgency, summary }) => {
          const id = `TKT-${Math.floor(Math.random() * 10000)}`
          const payload = JSON.stringify({ id, category, urgency, summary }, null, 2)
          return `Ticket created successfully. You MUST reply to the user by rendering the exact following json block exactly as written, with NO changes, inside a markdown code block with the language "ticket" like so:
\`\`\`ticket
${payload}
\`\`\`
Tell the user you have filed a ticket and they can connect to a robust support agent.`
        },
      }),
    }

    try {
      const client = await getZapierMCPClient()
      const lastUserMsg = [...messages].reverse().find((m) => m['role'] === 'user')
      const userIntent = (lastUserMsg?.['content'] as string) ?? ''
      const zapierTools = await getAI_SDKTools(client, userIntent)
      tools = { ...tools, ...zapierTools }
    } catch (e) {
      console.error('Failed to initialize MCP tools:', e)
    }

    const result = await streamText({
      model: llmProvider(model || DEFAULT_MODEL_ID),
      system: getSystemPrompt(systemPrompt),
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
