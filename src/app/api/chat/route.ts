import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { routeLLM, DEFAULT_MODEL } from '@/shared/lib/llm'
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(z.unknown()),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = requestSchema.parse(body)

    const result = streamText({
      model: routeLLM(DEFAULT_MODEL),
      system:
        'You are a helpful, intelligent assistant with access to Google Drive and Sheets. ' +
        'Be concise, conversational, and accurate.',
      messages: await convertToModelMessages(messages as UIMessage[]),
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[/api/chat]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
