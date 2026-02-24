'use client'

import { useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useChatStream } from '@/features/chat/hooks/useChatStream'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatWindow.module.css'

export function ChatWindow() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, input, setInput, isLoading, error, sendMessage } = useChatStream()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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
        <span className={styles.logo}>✦</span>
        <h1 className={styles.title}>LLM Chat</h1>
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
