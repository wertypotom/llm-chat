import { VectorStoreIndex, MetadataMode } from 'llamaindex'
import { vectorStore } from './vector-store'
import { configureLlamaIndex } from './rag-config'

// Ensure LlamaIndex embeddings are configured before querying
configureLlamaIndex()

/**
 * Retrieves raw text chunks from the Supabase Vector Store.
 * We skip LlamaIndex's built-in synthesizer (incompatible with Abacus LLM internals)
 * and return the raw chunks — the main LLM synthesizes the answer from system prompt context.
 */
export async function queryKnowledgeBase(query: string): Promise<string> {
  if (!query?.trim()) return ''
  console.log(`[RAG] Searching knowledge base for: "${query}"...`)

  try {
    // 1. Connect to the existing Supabase Vector Store
    const index = await VectorStoreIndex.fromVectorStore(vectorStore)

    // 2. Use retriever directly — skip LlamaIndex synthesizer (Abacus-incompatible)
    const retriever = index.asRetriever({ similarityTopK: 3 })
    // Pass as object — module duplication exposes raw _retrieve which needs { query } not string
    const nodes = await retriever.retrieve({ query } as Parameters<typeof retriever.retrieve>[0])

    console.log(`[RAG] Found ${nodes.length} matching source chunks.`)

    nodes.forEach((n) => console.log(`[RAG] chunk score: ${n.score?.toFixed(4)}`))

    // 3. Filter by relevance
    const SIMILARITY_THRESHOLD = 0.5
    const relevant = nodes.filter((n) => (n.score ?? 0) >= SIMILARITY_THRESHOLD)
    console.log(
      `[RAG] ${relevant.length}/${nodes.length} chunks above threshold ${SIMILARITY_THRESHOLD}`,
    )

    if (relevant.length === 0) return ''

    // 4. Concatenate raw text chunks
    return relevant.map((n) => n.node.getContent(MetadataMode.NONE)).join('\n\n---\n\n')
  } catch (error) {
    console.error('[RAG] Error querying knowledge base:', error)
    throw error
  }
}
