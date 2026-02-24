import { createOpenAI } from '@ai-sdk/openai'

/**
 * Abacus RouteLLM — Vercel AI SDK compatible client.
 */
export const llmProvider = createOpenAI({
  apiKey: process.env.ABACUS_API_KEY ?? '',
  baseURL: process.env.ABACUS_BASE_URL ?? 'https://routellm.abacus.ai/v1',
})

export const DEFAULT_MODEL = 'route-llm'

export const SYSTEM_PROMPT =
  'You are a helpful, intelligent assistant with access to various custom tools including Google Drive and Sheets. ' +
  'Be concise, conversational, and accurate. When asked to perform an action available via tools, do so without hesitation.'
