import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

/**
 * Strip `strict` from tool function definitions — Abacus/Gemini rejects it.
 */
function abacusFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.body && typeof init.body === 'string') {
    try {
      const body = JSON.parse(init.body)
      if (Array.isArray(body.tools)) {
        body.tools = body.tools.map((t: Record<string, unknown>) => {
          const fn = t['function'] as Record<string, unknown> | undefined
          if (!fn) return t

          // Strip `strict` — Abacus rejects it
          const rest = { ...fn } as Record<string, unknown>
          delete rest['strict']

          // Ensure parameters always has type:"object" + properties
          // Spread to preserve required/additionalProperties/etc that AI SDK kept
          const params = (rest.parameters ?? {}) as Record<string, unknown>
          rest.parameters = {
            ...params,
            type: 'object',
            properties: (params['properties'] as Record<string, unknown>) ?? {},
          }

          return { ...t, function: rest }
        })
        return fetch(input, { ...init, body: JSON.stringify(body) })
      }
    } catch {
      // not JSON — fall through
    }
  }
  return fetch(input, init)
}

import { env } from '@/shared/lib/env'

/**
 * Abacus RouteLLM — forces /chat/completions, strips unsupported params.
 */
export const llmProvider = createOpenAICompatible({
  name: 'abacus',
  apiKey: env.ABACUS_API_KEY,
  baseURL: env.ABACUS_BASE_URL,
  fetch: abacusFetch,
})

export const SYSTEM_PROMPT = `You are a helpful, intelligent assistant with access to Zapier MCP tools for Google Drive and Google Sheets.

Available capabilities:
- Google Drive: list files/folders, rename files and folders
- Google Sheets: create rows, columns, spreadsheets, worksheets; update and lookup rows

CRITICAL RULES FOR USING ZAPIER TOOLS:
- Every Zapier tool has an "instructions" field. You MUST fill it with a complete, specific natural language command.
- Include: the action, exact file/spreadsheet name, worksheet, and the exact data.
- Good example: "In the spreadsheet 'this is my doc', worksheet 'Sheet1', create a row with 'hello world' in column A."
- Good example: "List all files and folders in my Google Drive."
- Also fill optional fields (spreadsheet, worksheet, file, folder) when known.
- Never call a tool with empty arguments.
- If Zapier returns a followUpQuestion, call the tool again with more specific instructions addressing that question.
- Be concise and conversational.`
