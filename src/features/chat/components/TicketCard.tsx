import type { FC } from 'react'
import styles from './TicketCard.module.css'

interface TicketProps {
  id: string
  category: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  onConnect?: (agentId: string) => void
}

export const TicketCard: FC<TicketProps> = ({ id, category, urgency, summary, onConnect }) => {
  const handleConnect = () => {
    if (!onConnect) return
    const cat = category.toLowerCase()

    if (cat.includes('billing') || cat.includes('payment') || cat.includes('subscription')) {
      onConnect('billing_support')
    } else if (cat.includes('tech') || cat.includes('bug') || cat.includes('crash')) {
      onConnect('tech_support')
    } else {
      onConnect('general_support')
    }
  }

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <span className={styles.id}>{id}</span>
        <span className={`${styles.urgency} ${styles[urgency]}`}>{urgency}</span>
      </header>
      <div className={styles.body}>
        <div className={styles.category}>{category}</div>
        <p className={styles.summary}>{summary}</p>
      </div>
      <footer className={styles.footer}>
        <button onClick={handleConnect} className={styles.connectBtn}>
          Connect to Support Agent
        </button>
      </footer>
    </div>
  )
}
