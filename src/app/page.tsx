'use client'

import { ChatWindow } from '@/features/chat/components/ChatWindow'
import { useChatHistory } from '@/features/chat/hooks/useChatHistory'

export default function Home() {
  const {
    isMounted,
    sessions,
    activeId,
    activeSession,
    newSession,
    selectSession,
    updateSession,
    deleteSession,
  } = useChatHistory()

  if (!isMounted) return null

  return (
    <ChatWindow
      key={activeId}
      session={activeSession}
      sessions={sessions}
      activeId={activeId}
      onNew={newSession}
      onSelect={selectSession}
      onDelete={deleteSession}
      onMessagesChange={(msgs) => updateSession(activeSession.id, msgs)}
    />
  )
}
