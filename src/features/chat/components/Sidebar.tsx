'use client'

import type { FC } from 'react'
import { useState, useRef } from 'react'
import type { ChatSession } from '@/features/chat/types'
import styles from './Sidebar.module.css'

interface Props {
  sessions: ChatSession[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
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

export const Sidebar: FC<Props> = ({ sessions, activeId, onSelect, onNew, onDelete, open }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        alert(`Successfully indexed ${data.parsedPages} pages from ${file.name}`)
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      alert(`Upload failed: ${message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <div className={styles.inner}>
        <div className={styles.buttonGroup}>
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

          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload PDF for RAG context"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {isUploading ? 'Uploading & Indexing...' : 'Upload PDF'}
          </button>
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>
        <ul className={styles.list} role="listbox" aria-label="Chat history">
          {sessions.map((s) => (
            <li key={s.id} className={`${styles.item} ${s.id === activeId ? styles.active : ''}`}>
              <div
                className={styles.itemContent}
                onClick={() => onSelect(s.id)}
                role="option"
                aria-selected={s.id === activeId}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(s.id)}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span className={styles.itemTitle}>{sessionTitle(s)}</span>
                <span className={styles.itemTime} suppressHydrationWarning>
                  {relativeTime(s.updatedAt)}
                </span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this chat?')) onDelete(s.id)
                }}
                title="Delete chat"
                aria-label={`Delete chat ${sessionTitle(s)}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
