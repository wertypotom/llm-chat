'use client'

import { useState, useRef, useCallback } from 'react'
import type { ChatMessage } from '@/features/chat/types'

interface UseChatStreamReturn {
  messages: ChatMessage[]
  input: string
  setInput: (v: string) => void
  isLoading: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
}

export function useChatStream(): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return
      setError(null)

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      const assistantId = crypto.randomUUID()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
      ])

      try {
        abortRef.current = new AbortController()

        // Build history in simple role/content format for the API
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        // Show "using tools" indicator while waiting for multi-step completion
        const thinkingTimer = setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId && !m.content ? { ...m, content: '⏳ Using tools...' } : m,
            ),
          )
        }, 3000)

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: abortRef.current.signal,
        })

        clearTimeout(thinkingTimer)

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        let firstChunk = true
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m
              // Clear the thinking placeholder on first real content
              const base = firstChunk ? '' : m.content
              firstChunk = false
              return { ...m, content: base + chunk }
            }),
          )
        }

        // If stream ended with no text content (all steps were tool calls),
        // replace placeholder with a generic done message
        if (firstChunk) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: '✅ Done.' } : m)),
          )
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
          // Remove empty assistant bubble on error
          setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
        }
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading],
  )

  return { messages, input, setInput, isLoading, error, sendMessage }
}
