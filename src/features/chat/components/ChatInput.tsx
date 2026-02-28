'use client'

import type { FormEvent, ChangeEvent, FC } from 'react'
import styles from './ChatInput.module.css'

interface Props {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isConnected?: boolean
  isConnecting?: boolean
  onStartCall?: () => void
}

export const ChatInput: FC<Props> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  isConnected,
  isConnecting,
  onStartCall,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        e.currentTarget.form?.requestSubmit()
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <textarea
        id="chat-input"
        className={styles.textarea}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Message… (Enter to send, Shift+Enter for new line)"
        rows={1}
        disabled={isLoading}
        aria-label="Chat message input"
      />
      {!isConnected && !isConnecting && onStartCall && (
        <button
          type="button"
          onClick={onStartCall}
          className={styles.button}
          disabled={isLoading}
          aria-label="Start Live Call"
          title="Start Live Call"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            borderColor: 'transparent',
            marginRight: '8px',
          }}
        >
          📞
        </button>
      )}
      <button
        id="chat-send"
        type="submit"
        className={styles.button}
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
      >
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </form>
  )
}
