import { VectorStoreIndex } from 'llamaindex'
import { vectorStore } from './vector-store'
import { configureLlamaIndex } from './rag-config'

// Ensure LlamaIndex embeddings are configured before querying
configureLlamaIndex()

/**
 * Connects to the Supabase Vector Store and queries it using LlamaIndex.
 * @param query The user's search query
 * @returns A string containing the synthesized answer or the raw text chunks retrieved.
 */
export async function queryKnowledgeBase(query: string): Promise<string> {
  console.log(`[RAG] Searching knowledge base for: "${query}"...`)

  try {
    // 1. Connect to the existing Supabase Vector Store
    const index = await VectorStoreIndex.fromVectorStore(vectorStore)

    // 2. Create a query engine (retriever + synthesizer)
    // We use the default synthesizer which attempts to answer the question using the retrieved nodes.
    const queryEngine = index.asQueryEngine({
      retriever: index.asRetriever({ similarityTopK: 3 }),
    })

    // 3. Execute the query
    const response = await queryEngine.query({ query })

    console.log(`[RAG] Found ${response.sourceNodes?.length || 0} matching source chunks.`)

    // Return the synthesized text answer to the conversational LLM.
    // The LLM will then read this text and summarize it for the user.
    return response.response
  } catch (error) {
    console.error('[RAG] Error querying knowledge base:', error)
    return 'Could not retrieve information from the knowledge base due to an internal error.'
  }
}
