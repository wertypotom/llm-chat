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

const REQUIRED_TOOL_INSTRUCTIONS = `
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
- Be concise and conversational.
`

export function getSystemPrompt(customSystemPrompt?: string, ragContext?: string): string {
  const basePrompt =
    customSystemPrompt ||
    'You are a helpful, intelligent assistant with access to Zapier MCP tools for Google Drive and Google Sheets.'

  const ragSection = ragContext
    ? `\n\n--- RETRIEVED KNOWLEDGE BASE CONTEXT ---\nThe following information was retrieved from the private knowledge base and is FACTUAL. Use it to answer the user's question directly:\n${ragContext}\n--- END CONTEXT ---`
    : ''

  const toolDirectives = `
${REQUIRED_TOOL_INSTRUCTIONS}

CRITICAL RULES:
1. SUPPORT TICKETS: If the user describes ANY issue, bug, crash, registration failure, login problem, billing dispute, or frustration, you MUST invoke the 'createSupportTicket' tool IMMEDIATELY. DO NOT try to troubleshoot first.
2. INTERNAL KNOWLEDGE BASE: You have access to a private knowledge base. If context was retrieved above, use it to answer directly. If no context was injected, call 'searchKnowledgeBase' before refusing any factual query.
3. UPDATE INSTRUCTIONS: If the user asks you to be more or less polite, change your personality, alter your behavior, or adopt new rules, you MUST immediately call the 'update_my_instructions' tool. Do NOT simply comply in text.

If you have Zapier tools available, you can use those when specifically asked to draft emails or check calendars.`

  return `${basePrompt}${ragSection}${toolDirectives}`
}
