'use client'

import { useState, useCallback } from 'react'
import type { ChatSession, ChatMessage } from '@/features/chat/types'
import { loadSessions, saveSessions, loadActiveId, saveActiveId } from '@/features/chat/lib/storage'

function createSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function getInitialState(): { sessions: ChatSession[]; activeId: string } {
  const sessions = loadSessions()
  if (sessions.length === 0) {
    const s = createSession()
    return { sessions: [s], activeId: s.id }
  }
  const savedId = loadActiveId()
  const activeId = sessions.find((s) => s.id === savedId) ? savedId! : sessions[0].id
  return { sessions, activeId }
}

export function useChatHistory() {
  const [{ sessions, activeId }, setState] = useState(getInitialState)

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0]

  const persist = useCallback((next: ChatSession[], nextId: string) => {
    saveSessions(next)
    saveActiveId(nextId)
    setState({ sessions: next, activeId: nextId })
  }, [])

  const newSession = useCallback(() => {
    const s = createSession()
    const next = [s, ...sessions]
    persist(next, s.id)
  }, [sessions, persist])

  const selectSession = useCallback((id: string) => {
    saveActiveId(id)
    setState((prev) => ({ ...prev, activeId: id }))
  }, [])

  const updateSession = useCallback(
    (id: string, messages: ChatMessage[]) => {
      const next = sessions.map((s) =>
        s.id === id ? { ...s, messages, updatedAt: new Date() } : s,
      )
      saveSessions(next)
      setState((prev) => ({ ...prev, sessions: next }))
    },
    [sessions],
  )

  return { sessions, activeId, activeSession, newSession, selectSession, updateSession }
}
