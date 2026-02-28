import OpenAI from 'openai'

// Explicitly use the OpenAI API Key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // OpenAI SDK requires a File or ReadStream.
    // The web File object from FormData is supported directly in recent openai versions.
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      // Optionally add language or prompt to improve accuracy
    })

    return Response.json({ text: transcription.text })
  } catch (err) {
    console.error('STT Error:', err)
    return Response.json({ error: 'Failed to transcribe audio' }, { status: 500 })
  }
}
