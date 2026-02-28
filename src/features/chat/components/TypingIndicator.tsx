import styles from './TypingIndicator.module.css'

export function TypingIndicator() {
  return (
    <div className={styles.wrapper} aria-label="Assistant is typing" role="status">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  )
}
