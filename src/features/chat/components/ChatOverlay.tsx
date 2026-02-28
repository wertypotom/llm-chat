'use client'

import { useEffect, useRef, FormEvent } from 'react'
import type { ChatSession } from '@/features/chat/types'
import { useChatStream } from '@/features/chat/hooks/useChatStream'
import { useTTS } from '@/features/chat/hooks/useTTS'
import { useVoiceInput } from '@/features/chat/hooks/useVoiceInput'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatOverlay.module.css'

export function ChatOverlay() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLoadingRef = useRef(false)

  const { messages, input, setInput, isLoading, error, sendMessage } = useChatStream()
  const { speak } = useTTS()
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isTranscribing])

  // ALWAYS auto-play TTS for the overlay demo
  useEffect(() => {
    if (!isLoading && prevLoadingRef.current) {
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant' && last.content && !last.content.includes('Using tools...')) {
        // Only speak if it's actual content, not a placeholder
        speak(last.content, last.id)
      }
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, messages, speak])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage(text)
  }

  const handleMicClick = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording()
      if (transcribedText) {
        await sendMessage(transcribedText)
      }
    } else {
      await startRecording()
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div
          className={styles.loader}
          style={{
            display: isLoading || isTranscribing ? 'block' : 'none',
            width: '14px',
            height: '14px',
            borderWidth: '2px',
          }}
        />
        <h2 className={styles.title}>Voice Assistant</h2>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontSize: '0.9rem',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
          >
            Hi! I&apos;m here to help you apply. Ask me anything!
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} id={m.id} role={m.role} content={m.content} />
        ))}
        {isTranscribing && (
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', padding: '0.5rem' }}>
            Transcribing your voice...
          </div>
        )}
        {isLoading && messages.at(-1)?.role !== 'assistant' && <TypingIndicator />}
        {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>Error: {error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or click the mic..."
            disabled={isLoading || isRecording || isTranscribing}
          />
          <button
            type="button"
            className={`${styles.btn} ${styles.micBtn} ${isRecording ? styles.micBtnRecording : ''}`}
            onClick={handleMicClick}
            disabled={isLoading || isTranscribing}
            aria-label="Toggle voice recording"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isRecording ? (
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              ) : (
                <>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </>
              )}
            </svg>
          </button>
          {!isRecording && (
            <button
              type="submit"
              className={`${styles.btn} ${styles.sendBtn}`}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
