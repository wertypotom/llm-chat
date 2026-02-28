import { llmProvider, getSystemPrompt } from '@/shared/lib/llm'
import { DEFAULT_MODEL_ID } from '@/shared/lib/models'
import { getZapierMCPClient, getAI_SDKTools } from '@/shared/lib/mcp-client'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { z } from 'zod'
import { streamText, generateText, stepCountIs, tool } from 'ai'
import { supabase } from '@/shared/lib/supabase'
import type { ModelMessage } from 'ai'
import { queryKnowledgeBase } from '@/shared/lib/rag-query'

// Allow long multi-step Abacus calls (each LLM step can take 20-50s)
export const maxDuration = 300

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  agentId: z.string().optional(),
  userId: z.string().optional(),
  pageContext: z.array(z.record(z.string(), z.unknown())).optional(),
})

const createSupportTicketParameters = z.object({
  category: z
    .string()
    .describe('The category of the issue, e.g., "Technical", "Billing", "General Inquiry"'),
  urgency: z
    .enum(['low', 'medium', 'high', 'critical'])
    .describe('The urgency level of the issue based on user tone and impact'),
  summary: z.string().describe('A concise summary of the issue (1-2 sentences)'),
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
    const { messages, model, systemPrompt, agentId, userId, pageContext } =
      requestSchema.parse(body)

    let activeSystemPrompt = systemPrompt
    if (agentId && userId) {
      const { data } = await supabase
        .from('agents')
        .select('system_prompt')
        .eq('id', agentId)
        .eq('user_id', userId)
        .single()
      if (data?.system_prompt) {
        activeSystemPrompt = data.system_prompt
      }
    }

    let persistentSystemPrompt = activeSystemPrompt

    if (pageContext && pageContext.length > 0) {
      const formattedContext = JSON.stringify(pageContext, null, 2)
      activeSystemPrompt = activeSystemPrompt
        ? `${activeSystemPrompt}\n\n[PAGE CONTEXT]\nThe user is currently looking at a webpage with the following form fields. You can see what they have filled in so far based on 'value'. Use this to assist them:\n\`\`\`json\n${formattedContext}\n\`\`\``
        : `You are a helpful assistant. [PAGE CONTEXT]\nThe user is currently looking at a webpage with the following form fields. You can see what they have filled in so far based on 'value'. Use this to assist them:\n\`\`\`json\n${formattedContext}\n\`\`\``
    }

    // Extract the last user message text (handles string or multi-part array content)
    const lastUserMsg = [...messages].reverse().find((m) => m['role'] === 'user')
    const rawContent = lastUserMsg?.['content']
    const userQuery =
      typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? (((
              rawContent.find((p: Record<string, unknown>) => p['type'] === 'text') as Record<
                string,
                unknown
              >
            )?.['text'] as string) ?? '')
          : ''

    // Run RAG + MCP init in parallel.
    // MCP cold-start can take 50s — cap at 10s so it never blocks the LLM call.
    const [ragResult, mcpResult] = await Promise.allSettled([
      userQuery
        ? queryKnowledgeBase(userQuery).catch((e) => {
            console.error('[RAG] failed:', e)
            return ''
          })
        : Promise.resolve(''),
      Promise.race([
        getZapierMCPClient()
          .then((client) => getAI_SDKTools(client, userQuery))
          .catch((e) => {
            console.error('MCP failed:', e)
            return null
          }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
      ]),
    ])

    const ragContext = ragResult.status === 'fulfilled' ? ragResult.value : ''
    if (ragContext) console.log('[RAG] Pre-injected context length:', ragContext.length)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tools: Record<string, any> = {
      createSupportTicket: tool({
        description:
          'CRITICAL: You MUST call this tool IMMEDIATELY if the user reports a bug, error, registration issue, login problem, billing issue, or expresses frustration. DO NOT attempt to troubleshoot, ask for device info, or ask clarifying questions first. You MUST create the ticket first.',
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
      update_my_instructions: tool({
        description:
          'CRITICAL: Call this tool IMMEDIATELY if the user tells you to change your personality, tells you to be more/less polite, gives you a new conversational rule, or says "stop being X". This permanently rewrites your system prompt. DO NOT simply reply in conversation; you MUST call this tool to apply the change to the database.',
        parameters: z.object({
          feedback: z
            .string()
            .describe(
              'The user\'s feedback or new rule (e.g., "be more polite and use bullet points")',
            ),
        }),
        // @ts-expect-error type inference bug
        execute: async ({ feedback }) => {
          if (!agentId || !userId)
            return 'Error: Cannot update instructions without agentId and userId.'

          const currentPrompt = persistentSystemPrompt || 'You are a helpful assistant.'

          const { text: newPrompt } = await generateText({
            model: llmProvider(model || DEFAULT_MODEL_ID),
            system:
              'You are an expert prompt engineer. The user has given feedback on a system prompt. Your ONLY job is to rewrite the system prompt to obey the user. If the user tells the AI to be polite, REMOVE all rude/unhelpful instructions and REPLACE them with polite ones. Do NOT blend conflicting instructions. Output ONLY the raw new system prompt text. No markdown formatting, no explanations.',
            prompt: `CURRENT PROMPT:\n${currentPrompt}\n\nUSER FEEDBACK:\n${feedback}\n\nRewrite the current prompt to incorporate the feedback.`,
          })

          const { error } = await supabase
            .from('agents')
            .update({ system_prompt: newPrompt })
            .eq('id', agentId)
            .eq('user_id', userId)
            .select()

          if (error) {
            console.error('[DB Update Error]', error)
            return 'Failed to save new instructions to database.'
          }

          persistentSystemPrompt = newPrompt
          return `Successfully updated your persistent system instructions in the database. Tell the user: "I've permanently updated my instructions and will follow your new rules."`
        },
      }),
    }

    const zapierTools = mcpResult.status === 'fulfilled' ? mcpResult.value : null
    if (zapierTools) tools = { ...tools, ...zapierTools }

    const result = await streamText({
      model: llmProvider(model || DEFAULT_MODEL_ID),
      system: getSystemPrompt(activeSystemPrompt, ragContext),
      messages: messages as ModelMessage[],
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      stopWhen: stepCountIs(3),
      onFinish: ({ text, finishReason }) => {
        console.log(`[LLM] finish reason: ${finishReason}, text length: ${text.length}`)
      },
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
