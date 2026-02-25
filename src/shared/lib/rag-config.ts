import { OpenAIEmbedding } from '@llamaindex/openai'
import { Settings } from 'llamaindex'

// Configure LlamaIndex to use OpenAI for embeddings
// Using OpenAI embeddings to match 1536 dimension size in Supabase

export function configureLlamaIndex() {
  // Initialize the specific embedding model
  const embedModel = new OpenAIEmbedding({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY, // Note: We need OPENAI_API_KEY for true embeddings
  })

  // Set as global configuration for LlamaIndex
  Settings.embedModel = embedModel

  // Future-proofing: We can also set the main LLM here if needed,
  // but for raw Vector Store insert/query we mainly need the embedModel.
}
