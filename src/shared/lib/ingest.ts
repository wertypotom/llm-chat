import {
  Document,
  VectorStoreIndex,
  storageContextFromDefaults,
  SentenceSplitter,
} from 'llamaindex'
import { PDFReader } from '@llamaindex/readers/pdf'
import { vectorStore } from './vector-store'
import { configureLlamaIndex } from './rag-config'

// Ensure global settings (like Embeddings) are configured before ingestion
configureLlamaIndex()

/**
 * Parses a PDF buffer, splits it into chunks, generates embeddings,
 * and stores them in the Supabase Vector Store.
 *
 * @param fileBuffer The raw bytes of the PDF file
 * @param fileName The name of the original file (used for metadata)
 * @returns Details about the ingested document
 */
export async function ingestDocument(fileBuffer: Buffer, fileName: string) {
  console.log(`Starting ingestion for ${fileName} (${fileBuffer.length} bytes)...`)

  try {
    // 1. Parse the PDF into LlamaIndex Documents
    const reader = new PDFReader()
    // PDFReader.loadData expects a byte array (Uint8Array)
    const uint8Array = new Uint8Array(fileBuffer)
    const parsedDocuments = await reader.loadDataAsContent(uint8Array)

    // Convert parsed content into standard Documents with simple metadata
    const documents = parsedDocuments.map(
      (doc: any) =>
        new Document({
          text: doc.text,
          metadata: {
            fileName,
            source: 'pdf_upload',
            // You can add more metadata here like upload timestamp or user ID
          },
        }),
    )

    console.log(`Parsed ${documents.length} logical documents/pages from PDF. Creating index...`)

    // 2. Configure Chunking Strategy
    // Default splits into chunks of 1024 tokens with 200 token overlap
    const textSplitter = new SentenceSplitter({ chunkSize: 1024, chunkOverlap: 200 })

    // 3. Connect to Supabase Storage Context
    const storageContext = await storageContextFromDefaults({ vectorStore })

    // 4. Create Index (which automatically handles chunking, embedding, and DB insertion)
    const index = await VectorStoreIndex.fromDocuments(documents, {
      storageContext,
      // We explicitly pass the textSplitter to the document parsing pipeline
      // in newer LlamaIndex versions, it can also be configured globally in Settings.nodeParser
    })

    console.log(`Successfully ingested ${fileName} into Supabase vector store.`)

    return {
      success: true,
      fileName,
      parsedPages: documents.length,
    }
  } catch (error) {
    console.error('Error during document ingestion:', error)
    throw error
  }
}
