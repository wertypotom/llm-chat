import { OpenAIEmbedding } from '@llamaindex/openai'
import { Settings } from 'llamaindex'
import { env } from '@/shared/lib/env'

// Configure LlamaIndex to use OpenAI for embeddings
// Using OpenAI embeddings to match 1536 dimension size in Supabase

export function configureLlamaIndex() {
  // Initialize the specific embedding model
  const embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-small',
    apiKey: env.ABACUS_API_KEY,
    additionalSessionOptions: {
      baseURL: env.ABACUS_BASE_URL,
    },
  })

  // Set as global configuration for LlamaIndex
  Settings.embedModel = embedModel

  // Future-proofing: We can also set the main LLM here if needed,
  // but for raw Vector Store insert/query we mainly need the embedModel.
}
