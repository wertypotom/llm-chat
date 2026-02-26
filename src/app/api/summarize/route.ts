import { NextRequest, NextResponse } from 'next/server'
import { PDFReader } from '@llamaindex/readers/pdf'
import { summarizeDocument } from '@/shared/lib/summarize'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const isPDF = file.type === 'application/pdf'
    const isText = file.type === 'text/plain'

    if (!isPDF && !isText) {
      return NextResponse.json({ error: 'File must be a PDF or plain text file' }, { status: 400 })
    }

    let text: string

    if (isPDF) {
      const reader = new PDFReader()
      const uint8Array = new Uint8Array(await file.arrayBuffer())
      const docs = await reader.loadDataAsContent(uint8Array)
      text = docs.map((d: { text: string }) => d.text).join('\n\n')
    } else {
      text = await file.text()
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 })
    }

    console.log(`[Summarize API] Extracted ${text.length} chars from "${file.name}"`)
    const summary = await summarizeDocument(text)

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error: unknown) {
    console.error('[Summarize API] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
