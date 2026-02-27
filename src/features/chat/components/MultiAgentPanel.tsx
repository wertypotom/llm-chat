'use client'

import { useState, type FormEvent } from 'react'
import type { AgentMessage, AgentRole } from '@/features/chat/types'
import ReactMarkdown from 'react-markdown'
import styles from './MultiAgentPanel.module.css'

interface Props {
  modelId: string
}

type State = 'idle' | 'loading' | 'done' | 'error'

const ROLE_META: Record<AgentRole, { icon: string; label: string; css: string }> = {
  researcher: { icon: '🔬', label: 'Researcher', css: styles.roleResearcher },
  reviewer: { icon: '🔍', label: 'Reviewer', css: styles.roleReviewer },
  responder: { icon: '💬', label: 'Responder', css: styles.roleResponder },
}

function AgentThought({ msg, defaultOpen }: { msg: AgentMessage; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = ROLE_META[msg.role]
  const isLast = msg.role === 'responder'

  return (
    <div className={`${styles.thought} ${meta.css} ${isLast ? styles.finalAnswer : ''}`}>
      {isLast && <div className={styles.finalLabel}>Final Answer</div>}
      <div
        className={styles.thoughtHeader}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.roleIcon}>{meta.icon}</span>
        <span className={styles.roleName}>{meta.label}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▼</span>
      </div>
      {open && (
        <div className={styles.thoughtBody}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export function MultiAgentPanel({ modelId }: Props) {
  const [state, setState] = useState<State>('idle')
  const [query, setQuery] = useState('')
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([])
  const [finalAnswer, setFinalAnswer] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setState('loading')
    setAgentMessages([])
    setFinalAnswer('')
    setError('')

    try {
      const res = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, model: modelId }),
      })
      const data = (await res.json()) as {
        finalAnswer?: string
        agentMessages?: AgentMessage[]
        error?: unknown
      }
      if (!res.ok || !data.finalAnswer) {
        const errMsg =
          typeof data.error === 'string'
            ? data.error
            : Array.isArray(data.error)
              ? 'Validation error'
              : 'Unknown error'
        throw new Error(errMsg)
      }
      setFinalAnswer(data.finalAnswer)
      setAgentMessages(data.agentMessages ?? [])
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run multi-agent')
      setState('error')
    }
  }

  return (
    <div className={styles.panel}>
      <p className={styles.hint}>
        Ask a question and watch Researcher → Reviewer → Responder collaborate on an answer.
      </p>

      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <input
          className={styles.queryInput}
          type="text"
          placeholder="Ask the agent panel…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={state === 'loading'}
        />
        <button
          className={styles.submitBtn}
          type="submit"
          disabled={state === 'loading' || !query.trim()}
        >
          {state === 'loading' ? 'Thinking…' : 'Ask Agents ▶'}
        </button>
      </form>

      {state === 'loading' && (
        <div className={styles.status}>
          <span className={styles.spinner} aria-hidden="true" />
          Agents are deliberating… this may take a moment.
        </div>
      )}

      {state === 'error' && (
        <div className={`${styles.status} ${styles.statusError}`}>⚠ {error}</div>
      )}

      {state === 'done' && agentMessages.length > 0 && (
        <div className={styles.thoughts}>
          {agentMessages.map((msg, i) => (
            <AgentThought
              key={`${msg.agentId}-${i}`}
              msg={msg}
              defaultOpen={msg.role === 'responder'}
            />
          ))}
        </div>
      )}

      {state === 'done' && !agentMessages.length && finalAnswer && (
        <div className={styles.thoughts}>
          <div className={`${styles.thought} ${styles.finalAnswer} ${styles.roleResponder}`}>
            <div className={styles.finalLabel}>Final Answer</div>
            <div className={styles.thoughtBody}>
              <ReactMarkdown>{finalAnswer}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
