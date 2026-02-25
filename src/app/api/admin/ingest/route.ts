import { NextRequest, NextResponse } from 'next/server'
import { ingestDocument } from '@/shared/lib/ingest'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Run the LlamaIndex ingestion process
    const result = await ingestDocument(buffer, file.name)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('API Error during ingestion:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error during ingestion' },
      { status: 500 },
    )
  }
}
