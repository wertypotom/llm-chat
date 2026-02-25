'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ChatSession, ChatMessage } from '@/features/chat/types'
import { loadActiveId, saveActiveId, getUserId } from '@/features/chat/lib/storage'
import { supabase } from '@/shared/lib/supabase'

function createSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function useChatHistory() {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [state, setState] = useState<{ sessions: ChatSession[]; activeId: string }>({
    sessions: [],
    activeId: '',
  })

  useEffect(() => {
    async function fetchSessions() {
      try {
        const userId = getUserId()
        const { data } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })

        let loadedSessions: ChatSession[] = []

        if (data && data.length > 0) {
          loadedSessions = data.map((row) => ({
            id: row.id,
            messages: row.messages || [],
            createdAt: new Date(row.created_at || row.updated_at),
            updatedAt: new Date(row.updated_at),
          }))
        }

        if (loadedSessions.length === 0) {
          const s = createSession()
          loadedSessions = [s]
          // Save initial session to DB
          await supabase.from('chat_sessions').upsert({
            id: s.id,
            user_id: userId,
            messages: s.messages,
            updated_at: s.updatedAt.toISOString(),
          })
        }

        const savedId = loadActiveId()
        const activeId = loadedSessions.find((s) => s.id === savedId)
          ? savedId!
          : loadedSessions[0].id

        setState({ sessions: loadedSessions, activeId })
      } catch (err) {
        console.error('Failed to load sessions from Supabase:', err)
      } finally {
        setIsLoading(false)
        setIsMounted(true)
      }
    }
    fetchSessions()
  }, [])

  const { sessions, activeId } = state
  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0]

  const newSession = useCallback(async () => {
    const s = createSession()
    const next = [s, ...sessions]
    saveActiveId(s.id)
    setState({ sessions: next, activeId: s.id })
    const userId = getUserId()
    const { error } = await supabase.from('chat_sessions').upsert({
      id: s.id,
      user_id: userId,
      messages: s.messages,
      updated_at: s.updatedAt.toISOString(),
    })
    if (error) console.error(error)
  }, [sessions])

  const selectSession = useCallback((id: string) => {
    saveActiveId(id)
    setState((prev) => ({ ...prev, activeId: id }))
  }, [])

  const updateSession = useCallback(
    async (id: string, messages: ChatMessage[]) => {
      const now = new Date()
      const next = sessions.map((s) => (s.id === id ? { ...s, messages, updatedAt: now } : s))
      setState((prev) => ({ ...prev, sessions: next }))

      const userId = getUserId()
      const { error } = await supabase.from('chat_sessions').upsert(
        {
          id,
          user_id: userId,
          messages,
          updated_at: now.toISOString(),
        },
        { onConflict: 'id' },
      )
      if (error) console.error(error)
    },
    [sessions],
  )

  return {
    isMounted,
    isLoading,
    sessions,
    activeId,
    activeSession,
    newSession,
    selectSession,
    updateSession,
  }
}
