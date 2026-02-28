import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const instructions =
      body.instructions ||
      'You are a helpful AI assistant. Keep your responses extremely concise and conversational, as you are on a live phone call. Do not use markdown.'

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: instructions,
        input_audio_transcription: {
          model: 'whisper-1',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI Realtime Token Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate real-time token' },
        { status: response.status },
      )
    }

    const data = await response.json()

    // data.client_secret.value contains the ephemeral token
    return NextResponse.json({
      client_secret: data.client_secret.value,
    })
  } catch (error) {
    console.error('Session Token Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
