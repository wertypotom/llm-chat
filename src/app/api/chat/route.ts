import { llmProvider, DEFAULT_MODEL, SYSTEM_PROMPT } from '@/shared/lib/llm'
import { getZapierMCPClient, getAI_SDKTools } from '@/shared/lib/mcp-client'
import { z } from 'zod'
import { streamText, convertToModelMessages } from 'ai'

const requestSchema = z.object({
  messages: z.array(z.any()),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    let tools = {}
    try {
      const client = await getZapierMCPClient()
      tools = await getAI_SDKTools(client)
    } catch (e) {
      console.error('Failed to initialize MCP tools:', e)
      // gracefully fail and continue without tools
    }

    const result = await streamText({
      model: llmProvider(DEFAULT_MODEL),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: Object.keys(tools).length > 0 ? tools : undefined,
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
