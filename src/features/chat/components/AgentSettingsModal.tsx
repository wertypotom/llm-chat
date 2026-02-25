'use client'

import { useState } from 'react'
import { Agent } from '@/features/chat/types'
import styles from './AgentSettingsModal.module.css'

interface Props {
  customAgents: Agent[]
  onAdd: (a: Agent) => void
  onUpdate: (id: string, updates: Partial<Agent>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function AgentSettingsModal({ customAgents, onAdd, onUpdate, onDelete, onClose }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')

  const handleEdit = (a: Agent) => {
    setEditingId(a.id)
    setName(a.name)
    setPrompt(a.systemPrompt ?? '')
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (editingId) {
      onUpdate(editingId, { name, systemPrompt: prompt })
    } else {
      onAdd({
        id: crypto.randomUUID(),
        name,
        systemPrompt: prompt,
      })
    }
    setEditingId(null)
    setName('')
    setPrompt('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setName('')
    setPrompt('')
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2>Manage Custom Agents</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.list}>
            <h3>Your Agents</h3>
            {customAgents.length === 0 ? (
              <p className={styles.empty}>No custom agents created yet.</p>
            ) : (
              <ul>
                {customAgents.map((a) => (
                  <li key={a.id}>
                    <div className={styles.agentInfo}>
                      <strong>{a.name}</strong>
                    </div>
                    <div className={styles.actions}>
                      <button onClick={() => handleEdit(a)}>Edit</button>
                      <button onClick={() => onDelete(a.id)} className={styles.danger}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.editor}>
            <h3>{editingId ? 'Edit Agent' : 'Create New Agent'}</h3>
            <div className={styles.field}>
              <label>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Code Reviewer"
              />
            </div>
            <div className={styles.field}>
              <label>System Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="You are an expert at..."
                rows={5}
              />
            </div>
            <div className={styles.formActions}>
              {editingId && <button onClick={handleCancelEdit}>Cancel</button>}
              <button onClick={handleSave} className={styles.primary} disabled={!name.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
