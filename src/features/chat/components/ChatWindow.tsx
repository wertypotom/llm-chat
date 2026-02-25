'use client'

import { useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useChatStream } from '@/features/chat/hooks/useChatStream'
import { useTTS } from '@/features/chat/hooks/useTTS'
import { useAutoPlayTTS } from '@/features/chat/hooks/useAutoPlayTTS'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatWindow.module.css'

export function ChatWindow() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLoadingRef = useRef(false)
  const { messages, input, setInput, isLoading, error, sendMessage } = useChatStream()
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
    // Stream just finished
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
    <div className={styles.root}>
      <header className={styles.header}>
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
        <button
          className={`${styles.autoPlayBtn} ${autoPlay ? styles.autoPlayBtnOn : ''}`}
          onClick={toggleAutoPlay}
          title={autoPlay ? 'Auto-play ON — click to disable' : 'Auto-play OFF — click to enable'}
          aria-pressed={autoPlay}
        >
          Auto-play
        </button>
      </header>

      <div className={styles.messages} role="log" aria-live="polite">
        {messages.length === 0 && <p className={styles.empty}>Send a message to start chatting…</p>}
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
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
  )
}
