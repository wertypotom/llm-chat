'use client'

import type { FC } from 'react'
import type { MessageRole } from '@/features/chat/types'
import ReactMarkdown, { Components } from 'react-markdown'
import { useTTS } from '@/features/chat/hooks/useTTS'
import { TicketCard } from './TicketCard'
import styles from './MessageBubble.module.css'

interface Props {
  role: MessageRole | string
  content: string
}

export const MessageBubble: FC<Props> = ({ role, content }) => {
  const isUser = role === 'user'
  const { speak, isPlaying, stop } = useTTS()

  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      if (match && match[1] === 'ticket') {
        try {
          const data = JSON.parse(String(children).replace(/\n$/, ''))
          return <TicketCard {...data} />
        } catch {
          // fallback to normal code block if malformed
        }
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
        {!isUser && content && (
          <button
            className={`${styles.ttsBtn} ${isPlaying ? styles.ttsBtnActive : ''}`}
            onClick={() => (isPlaying ? stop() : speak(content))}
            title={isPlaying ? 'Stop' : 'Play audio'}
            aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
          >
            {isPlaying ? '⏹' : '🔊'}
          </button>
        )}
      </div>
    </div>
  )
}
