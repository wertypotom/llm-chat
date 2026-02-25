export interface AIModel {
  id: string
  name: string
}

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'route-llm', name: 'Abacus RouteLLM (Default)' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
]

export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id
