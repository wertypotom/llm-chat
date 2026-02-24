'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatWindow.module.css'

function getTextContent(m: UIMessage): string {
  return m.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
}

export function ChatWindow() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, error } = useChat()

  const isLoading = status === 'streaming' || status === 'submitted'

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
    await sendMessage({ text })
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>✦</span>
        <h1 className={styles.title}>LLM Chat</h1>
      </header>

      <div className={styles.messages} role="log" aria-live="polite">
        {messages.length === 0 && <p className={styles.empty}>Send a message to start chatting…</p>}
        {messages.map((m: UIMessage) => (
          <MessageBubble key={m.id} role={m.role} content={getTextContent(m)} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && <p className={styles.error}>Error: {error.message}</p>}
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
