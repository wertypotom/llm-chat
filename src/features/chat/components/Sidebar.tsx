'use client'

import type { FC } from 'react'
import type { ChatSession } from '@/features/chat/types'
import styles from './Sidebar.module.css'

interface Props {
  sessions: ChatSession[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  open: boolean
}

function sessionTitle(s: ChatSession): string {
  const first = s.messages.find((m) => m.role === 'user')
  if (first?.content) {
    return first.content.length > 36 ? first.content.slice(0, 36) + '…' : first.content
  }
  return 'New chat'
}

function relativeTime(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const Sidebar: FC<Props> = ({ sessions, activeId, onSelect, onNew, open }) => (
  <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-hidden={!open}>
    <div className={styles.inner}>
      <button className={styles.newBtn} onClick={onNew} title="New chat">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New chat
      </button>
      <ul className={styles.list} role="listbox" aria-label="Chat history">
        {sessions.map((s) => (
          <li
            key={s.id}
            className={`${styles.item} ${s.id === activeId ? styles.active : ''}`}
            onClick={() => onSelect(s.id)}
            role="option"
            aria-selected={s.id === activeId}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(s.id)}
          >
            <span className={styles.itemTitle}>{sessionTitle(s)}</span>
            <span className={styles.itemTime}>{relativeTime(s.updatedAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  </aside>
)
