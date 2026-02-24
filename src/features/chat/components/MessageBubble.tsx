import type { FC } from 'react'
import type { MessageRole } from '@/features/chat/types'
import ReactMarkdown from 'react-markdown'
import styles from './MessageBubble.module.css'

interface Props {
  role: MessageRole | string
  content: string
}

export const MessageBubble: FC<Props> = ({ role, content }) => {
  const isUser = role === 'user'
  return (
    <div className={`${styles.wrapper} ${isUser ? styles.user : styles.assistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
