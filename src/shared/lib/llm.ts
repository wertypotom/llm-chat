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
          const { strict: _, ...rest } = fn as { strict?: unknown } & Record<string, unknown>

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

/**
 * Abacus RouteLLM — forces /chat/completions, strips unsupported params.
 */
export const llmProvider = createOpenAICompatible({
  name: 'abacus',
  apiKey: process.env.ABACUS_API_KEY ?? '',
  baseURL: process.env.ABACUS_BASE_URL ?? 'https://routellm.abacus.ai/v1',
  fetch: abacusFetch,
})

export const DEFAULT_MODEL = 'gpt-5'

export const SYSTEM_PROMPT = `You are a helpful, intelligent assistant with access to Zapier MCP tools for Google Drive and Google Sheets.

CRITICAL RULES FOR USING ZAPIER TOOLS:
- Every Zapier tool has an "instructions" field. You MUST always fill it with a complete, specific natural language command.
- The "instructions" field tells Zapier's AI exactly what to do. It must include: the action, the exact spreadsheet/file name, the worksheet/tab name, and the exact data.
- Example of a GOOD instructions value: "In the spreadsheet called 'this is my doc', on the worksheet 'Sheet1', create a new row and put 'hello world' in column A."
- Also fill in the optional fields (spreadsheet, worksheet, etc.) when you know them — pass them alongside instructions.
- Do NOT call a tool with empty arguments. Always include instructions with full context before calling.
- If Zapier returns a followUpQuestion asking for clarification, answer it by calling the tool again with more specific instructions that address the question.
- Be concise and conversational in your responses.`
