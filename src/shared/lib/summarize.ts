import { SentenceSplitter } from 'llamaindex'
import { generateText } from 'ai'
import { llmProvider } from './llm'
import { DEFAULT_MODEL_ID } from './models'

const CHUNK_SIZE = 3000 // characters (not tokens — safe estimate for ~750 tokens)
const CONCURRENCY = 5 // max parallel LLM calls in the Map phase

/**
 * Split text into chunks using LlamaIndex SentenceSplitter.
 * Falls back to naive character split if the splitter fails.
 */
function chunkText(text: string): string[] {
  try {
    const splitter = new SentenceSplitter({ chunkSize: CHUNK_SIZE, chunkOverlap: 200 })
    const nodes = splitter.splitText(text)
    return nodes.filter((n) => n.trim().length > 0)
  } catch {
    // Naive fallback
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE))
    }
    return chunks
  }
}

/**
 * Runs an array of async tasks in batches of `concurrency` at a time.
 */
async function runBatched<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency).map((fn) => fn())
    results.push(...(await Promise.all(batch)))
  }
  return results
}

/**
 * Summarize a single chunk of text.
 */
async function summarizeChunk(chunk: string, index: number, total: number): Promise<string> {
  const { text } = await generateText({
    model: llmProvider(DEFAULT_MODEL_ID),
    prompt: `You are summarizing chunk ${index + 1} of ${total} from a larger document.
Produce a concise bullet-point summary capturing all key facts, numbers, and conclusions.
Do NOT add any preamble or commentary.

CHUNK:
${chunk}`,
  })
  return text.trim()
}

/**
 * Map-Reduce summarization for large documents.
 *
 * 1. Map  — chunk text, summarize each chunk in parallel (batches of ${CONCURRENCY})
 * 2. Reduce — merge all chunk summaries into a final cohesive summary
 *
 * @param text  Raw document text (any length)
 * @returns     Final summary string
 */
export async function summarizeDocument(text: string): Promise<string> {
  if (!text?.trim()) throw new Error('summarizeDocument: empty input')

  const chunks = chunkText(text)
  console.log(`[Summarize] ${chunks.length} chunks, concurrency=${CONCURRENCY}`)

  if (chunks.length === 1) {
    // Single chunk — skip reduce step, return direct summary
    return summarizeChunk(chunks[0], 0, 1)
  }

  // MAP — summarize each chunk
  const chunkSummaries = await runBatched(
    chunks.map((chunk, i) => () => summarizeChunk(chunk, i, chunks.length)),
    CONCURRENCY,
  )

  console.log(`[Summarize] Map complete. Reducing ${chunkSummaries.length} summaries...`)

  // REDUCE — merge all chunk summaries
  const { text: finalSummary } = await generateText({
    model: llmProvider(DEFAULT_MODEL_ID),
    prompt: `You are given ${chunkSummaries.length} bullet-point summaries of sections from a single document.
Produce ONE cohesive, well-structured final summary that:
- Merges all key facts without duplication
- Preserves important numbers and conclusions
- Uses clear paragraphs or bullet points as appropriate

CHUNK SUMMARIES:
${chunkSummaries.map((s, i) => `--- Section ${i + 1} ---\n${s}`).join('\n\n')}`,
  })

  return finalSummary.trim()
}
