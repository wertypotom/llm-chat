import type { ChatSession } from '@/features/chat/types'

const SESSIONS_KEY = 'chat:sessions'
const ACTIVE_KEY = 'chat:activeId'

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ChatSession[]
  } catch {
    return []
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}
