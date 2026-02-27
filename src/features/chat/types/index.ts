export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt?: Date
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface Agent {
  id: string
  name: string
  systemPrompt?: string
  isHidden?: boolean
  voiceId?: string
}

// Multi-agent orchestration types
export type AgentRole = 'researcher' | 'reviewer' | 'responder'

export interface AgentPersona {
  id: string
  name: string
  role: AgentRole
  systemPrompt: string
}

export interface AgentMessage {
  agentId: string
  agentName: string
  role: AgentRole
  content: string
}

export interface OrchestrationResult {
  finalAnswer: string
  agentMessages: AgentMessage[]
}
