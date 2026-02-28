'use client'

import { useState, useRef, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './MultiAgentPanel.module.css'

interface Props {
  modelId: string
}

interface AgentMsg {
  agent: string
  content: string
}

type State = 'idle' | 'loading' | 'done' | 'error'

export function MultiAgentPanel({ modelId }: Props) {
  const [state, setState] = useState<State>('idle')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<AgentMsg[]>([])
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // suppress unused var lint — modelId reserved for future model selection passthrough
  void modelId

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setState('loading')
    setMessages([])
    setError('')

    try {
      abortRef.current = new AbortController()

      const res = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error('Failed to start discussion (Server Error)')
      }

      if (!res.body) {
        throw new Error('ReadableStream not yet supported in this browser.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')

        // Keep the last chunk in the buffer if it doesn't end with \n\n
        buffer = events.pop() ?? ''

        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6)
            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.done) {
                setState('done')
              } else if (parsed.agent && parsed.content) {
                setMessages((prev) => [...prev, { agent: parsed.agent, content: parsed.content }])
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON:', err)
            }
          }
        }
      }

      setState('done')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream aborted by user')
        setState('done')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to run multi-agent')
      setState('error')
    }
  }

  function stopDiscussion() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <a href="/" className={styles.backBtn}>
          ← Back to Chat
        </a>
        <h1 className={styles.title}>Multi-Agent Room</h1>
        <p className={styles.hint}>
          Two AutoGen agents (Analyst ↔ Critic) will discuss your question.
        </p>
      </div>

      <div className={styles.conversation}>
        {state === 'idle' && (
          <div className={styles.status} style={{ justifyContent: 'center', height: '100%' }}>
            Ready to start a discussion.
          </div>
        )}

        {state === 'loading' && messages.length === 0 && (
          <div className={styles.status} style={{ justifyContent: 'center', height: '100%' }}>
            <span className={styles.spinner} aria-hidden="true" />
            Agents are starting the discussion…
          </div>
        )}

        {state === 'error' && (
          <div
            className={`${styles.status} ${styles.statusError}`}
            style={{ justifyContent: 'center', height: '100%' }}
          >
            ⚠ {error}
          </div>
        )}

        {messages.length > 0 && (
          <div className={styles.conversationInner}>
            {messages.map((msg, i) => {
              const isAnalyst = msg.agent === 'Analyst'
              return (
                <div
                  key={i}
                  className={`${styles.agentMsg} ${isAnalyst ? styles.agentLeft : styles.agentRight}`}
                >
                  <div className={styles.agentName}>
                    <span className={styles.agentIcon}>{isAnalyst ? '🔬' : '🔍'}</span>
                    {msg.agent}
                  </div>
                  <div
                    className={`${styles.agentBubble} ${isAnalyst ? styles.bubbleAnalyst : styles.bubbleCritic}`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )
            })}

            {state === 'loading' && (
              <div className={styles.status} style={{ padding: '0 0.5rem' }}>
                <span className={styles.spinner} aria-hidden="true" />
                Agents are typing…
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.inputContainer}>
        <form className={styles.inputRow} onSubmit={handleSubmit}>
          <input
            className={styles.queryInput}
            type="text"
            placeholder="Ask the agents to discuss…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={state === 'loading'}
          />
          {state === 'loading' ? (
            <button
              className={styles.submitBtn}
              type="button"
              onClick={stopDiscussion}
              style={{ background: '#ef4444' }}
              title="Stop Discussion"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button className={styles.submitBtn} type="submit" disabled={!query.trim()}>
              Start Discussion ▶
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
