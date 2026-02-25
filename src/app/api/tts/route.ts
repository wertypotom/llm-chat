import { NextRequest } from 'next/server'
import { z } from 'zod'
import { env } from '@/shared/lib/env'

const bodySchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
})

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, voiceId } = bodySchema.parse(body)
    const activeVoiceId = voiceId || DEFAULT_VOICE_ID

    console.log(`[TTS] Requesting voiceId: ${activeVoiceId} (Provided: ${voiceId})`)

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${activeVoiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    )

    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('[TTS] ElevenLabs error:', err)
      return Response.json({ error: 'TTS failed' }, { status: upstream.status })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues }, { status: 400 })
    }
    console.error('[TTS]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
