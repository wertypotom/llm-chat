'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { ChatSession } from '@/features/chat/types'
import { useChatStream } from '@/features/chat/hooks/useChatStream'
import { useTTS } from '@/features/chat/hooks/useTTS'
import { useAutoPlayTTS } from '@/features/chat/hooks/useAutoPlayTTS'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import { Sidebar } from './Sidebar'
import { ModelSelector } from './ModelSelector'
import { AgentSelector } from './AgentSelector'
import { AgentSettingsModal } from './AgentSettingsModal'
import { useGlobalModel } from '@/features/chat/hooks/useGlobalModel'
import { AVAILABLE_MODELS } from '@/shared/lib/models'
import { useAgents } from '@/features/chat/hooks/useAgents'
import styles from './ChatWindow.module.css'

interface Props {
  session: ChatSession
  sessions: ChatSession[]
  activeId: string
  onNew: () => void
  onSelect: (id: string) => void
  onMessagesChange: (messages: ChatSession['messages']) => void
}

export function ChatWindow({
  session,
  sessions,
  activeId,
  onNew,
  onSelect,
  onMessagesChange,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLoadingRef = useRef(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAgentModal, setShowAgentModal] = useState(false)

  const { modelId, setModelId } = useGlobalModel()
  const {
    visibleAgents,
    customAgents,
    activeAgent,
    activeId: activeAgentId,
    setActiveId: setActiveAgentId,
    addAgent,
    updateAgent,
    deleteAgent,
    isMounted,
  } = useAgents()

  const { messages, input, setInput, isLoading, error, sendMessage } = useChatStream({
    initialMessages: session.messages,
    onMessagesChange,
    modelId,
    systemPrompt: activeAgent?.systemPrompt,
  })

  const { speak } = useTTS()
  const { autoPlay, toggleAutoPlay } = useAutoPlayTTS()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-play TTS on stream completion (isLoading: true → false)
  useEffect(() => {
    if (!autoPlay) {
      prevLoadingRef.current = isLoading
      return
    }
    if (!isLoading && prevLoadingRef.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content) {
        speak(last.content)
      }
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, autoPlay, messages, speak])

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={onSelect}
        onNew={onNew}
        open={sidebarOpen}
      />
      <div className={styles.root}>
        <header className={styles.header}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title="Toggle history"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className={styles.logo} aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className={styles.title}>LLM Chat</h1>
          {isMounted && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ModelSelector
                models={AVAILABLE_MODELS}
                value={modelId}
                onChange={setModelId}
                disabled={isLoading}
              />
              <AgentSelector
                agents={visibleAgents}
                activeAgent={activeAgent}
                value={activeAgentId}
                disabled={isLoading}
                onChange={(id) => {
                  if (id === 'manage') setShowAgentModal(true)
                  else setActiveAgentId(id)
                }}
              />
            </div>
          )}
          <button
            className={`${styles.autoPlayBtn} ${autoPlay ? styles.autoPlayBtnOn : ''}`}
            onClick={toggleAutoPlay}
            title={autoPlay ? 'Auto-play ON — click to disable' : 'Auto-play OFF'}
            aria-pressed={autoPlay}
          >
            Auto-play
          </button>
        </header>

        <div className={styles.messages} role="log" aria-live="polite">
          {messages.length === 0 && (
            <p className={styles.empty}>Send a message to start chatting…</p>
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              onConnectSupport={(agentId) => setActiveAgentId(agentId)}
            />
          ))}
          {isLoading && messages.at(-1)?.role !== 'assistant' && <TypingIndicator />}
          {error && <p className={styles.error}>Error: {error}</p>}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {showAgentModal && (
        <AgentSettingsModal
          customAgents={customAgents}
          onClose={() => setShowAgentModal(false)}
          onAdd={addAgent}
          onUpdate={updateAgent}
          onDelete={deleteAgent}
        />
      )}
    </div>
  )
}
