import { openaiClient, DEFAULT_MODEL, SYSTEM_PROMPT } from '@/shared/lib/llm'
import { z } from 'zod'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    const allMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ]

    const stream = await openaiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: allMessages,
      stream: true,
    })

    // Stream text chunks as a plain text stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[/api/chat]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
