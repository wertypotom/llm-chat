import { NextRequest, NextResponse } from 'next/server'
import { summarizeDocument } from '@/shared/lib/summarize'

export const maxDuration = 300

// pdf-parse (albertcui/pdf-parse) — exports a single async function: pdf(buffer) => { text }
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
      const buffer = Buffer.from(await file.arrayBuffer())

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFParse = eval("require('pdf-parse')")
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      text = result.text
      await parser.destroy()
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
