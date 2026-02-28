'use client'

import { useState, type FormEvent } from 'react'
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
      const res = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = (await res.json()) as {
        messages?: AgentMsg[]
        error?: unknown
      }
      if (!res.ok || !data.messages?.length) {
        const errMsg =
          typeof data.error === 'string'
            ? data.error
            : Array.isArray(data.error)
              ? 'Validation error'
              : 'No response from agents'
        throw new Error(errMsg)
      }
      setMessages(data.messages)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run multi-agent')
      setState('error')
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
          <button
            className={styles.submitBtn}
            type="submit"
            disabled={state === 'loading' || !query.trim()}
          >
            {state === 'loading' ? 'Thinking…' : 'Start Discussion ▶'}
          </button>
        </form>
      </div>
    </div>
  )
}
