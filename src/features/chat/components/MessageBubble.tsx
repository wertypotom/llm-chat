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
  onConnectSupport?: () => void
}

export const MessageBubble: FC<Props> = ({ role, content, onConnectSupport }) => {
  const isUser = role === 'user'
  const { speak, isPlaying, stop } = useTTS()

  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const raw = Array.isArray(children) ? children.join('') : String(children)

      // Handle properly formatted markdown block: ```ticket \n {...} \n ```
      if (match && match[1] === 'ticket') {
        try {
          const data = JSON.parse(raw.trim())
          return <TicketCard {...data} onConnect={onConnectSupport} />
        } catch (e) {
          console.error('Failed to parse ticket JSON:', e)
        }
      }

      // Handle inline or malformed markdown: ```ticket { "id": "TKT-123" }```
      if (raw.trim().startsWith('ticket {')) {
        try {
          const jsonStr = raw.replace(/^ticket\s*/, '').trim()
          const data = JSON.parse(jsonStr)
          return <TicketCard {...data} onConnect={onConnectSupport} />
        } catch (e) {
          console.error('Failed to parse inline ticket JSON:', e)
        }
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    p({ children, ...props }) {
      const raw = Array.isArray(children) ? children.join('') : String(children)

      // If the LLM sent the ticket block as inline text without newlines,
      // it gets treated as a regular paragraph instead of `code`.
      const ticketMatch = /```ticket\s*({[^}]+})/.exec(raw)

      if (ticketMatch) {
        try {
          const jsonStr = ticketMatch[1]
          const data = JSON.parse(jsonStr)

          // Split the text to render the TicketCard in the middle of the paragraph
          const [before, after] = raw.split(ticketMatch[0])

          return (
            <div className={props.className}>
              {before && <p>{before}</p>}
              <TicketCard {...data} onConnect={onConnectSupport} />
              {after && <p>{after.replace(/^```/, '')}</p>} {/* strip trailing backticks if any */}
            </div>
          )
        } catch (e) {
          console.error('Failed to parse inline paragraph ticket JSON:', e)
        }
      }

      return <p {...props}>{children}</p>
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
