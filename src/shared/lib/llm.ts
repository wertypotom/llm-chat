import { createOpenAI } from '@ai-sdk/openai'

/**
 * RouteLLM provider via Abacus.ai
 * OpenAI-compatible endpoint — just a custom baseURL + API key.
 *
 * Env vars required:
 *   ABACUS_API_KEY   — your Abacus.ai ChatLLM API key
 *   ABACUS_BASE_URL  — https://api.abacus.ai/api/v0/routellm (default below)
 */
export const routeLLM = createOpenAI({
  apiKey: process.env.ABACUS_API_KEY ?? '',
  baseURL: process.env.ABACUS_BASE_URL ?? 'https://api.abacus.ai/api/v0/routellm',
})

/**
 * Default model identifier used with RouteLLM router.
 * Abacus automatically selects the best underlying LLM.
 */
export const DEFAULT_MODEL = 'route-llm'
