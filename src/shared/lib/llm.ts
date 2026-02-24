import OpenAI from 'openai'

/**
 * Abacus RouteLLM — OpenAI-compatible client.
 * Per Abacus docs: openai package with custom baseURL.
 */
export const openaiClient = new OpenAI({
  apiKey: process.env.ABACUS_API_KEY ?? '',
  baseURL: process.env.ABACUS_BASE_URL ?? 'https://routellm.abacus.ai/v1',
})

export const DEFAULT_MODEL = 'gpt-5'

export const SYSTEM_PROMPT =
  'You are a helpful, intelligent assistant with access to Google Drive and Sheets. ' +
  'Be concise, conversational, and accurate.'
