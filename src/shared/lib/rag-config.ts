import { OpenAIEmbedding, OpenAI } from '@llamaindex/openai'
import { Settings } from 'llamaindex'
import { env } from '@/shared/lib/env'

// Configure LlamaIndex to use OpenAI for embeddings
// Using OpenAI embeddings to match 1536 dimension size in Supabase

export function configureLlamaIndex() {
  // Initialize the specific embedding model
  const embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Set as global configuration for LlamaIndex
  Settings.embedModel = embedModel

  // Configure the global LLM used for synthesizing Vector DB results into human answers
  const llm = new OpenAI({
    model: 'gpt-4o',
    apiKey: env.ABACUS_API_KEY,
    additionalSessionOptions: {
      baseURL: env.ABACUS_BASE_URL,
    },
  })
  Settings.llm = llm
}
