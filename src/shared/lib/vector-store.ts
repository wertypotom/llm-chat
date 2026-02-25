import { SupabaseVectorStore } from '@llamaindex/supabase'

// Ensure we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables for Vector Store')
}

// Initialize the Supabase Vector Store
export const vectorStore = new SupabaseVectorStore({
  supabaseUrl,
  supabaseKey,
  table: 'documents', // This matches the table created in the SQL script
})
