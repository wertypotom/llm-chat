export interface AIModel {
  id: string
  name: string
}

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'route-llm', name: 'Abacus RouteLLM (Default)' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT 4o mini' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro, Preview' },
]

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id
