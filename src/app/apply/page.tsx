'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatSession } from '@/features/chat/types'
import { ChatOverlay } from '@/features/chat/components/ChatOverlay'
import { supabase } from '@/shared/lib/supabase'
import { getUserId } from '@/features/chat/lib/storage'
import styles from './page.module.css'

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleMessagesChange = async (messages: ChatSession['messages']) => {
    if (!sessionIdRef.current || messages.length === 0) return
    const userId = getUserId()
    await supabase.from('chat_sessions').upsert({
      id: sessionIdRef.current,
      user_id: userId,
      messages,
      updated_at: new Date().toISOString(),
    })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}></div>
        <h1>Acme Corp Careers</h1>
        <p>Apply to join our mission-driven team.</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Back to Main Chat
        </a>
      </header>

      <main className={styles.main}>
        {submitted ? (
          <div className={styles.success}>
            <h2>Application Submitted!</h2>
            <p>Thank you for applying. We will be in touch shortly.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="role">Role Applied For</label>
              <select id="role" name="role" defaultValue="" required>
                <option value="" disabled>
                  Select a role...
                </option>
                <option value="frontend">Senior Frontend Engineer</option>
                <option value="backend">Backend Systems Engineer</option>
                <option value="design">Product Designer</option>
                <option value="sales">Account Executive</option>
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" placeholder="Jane" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" placeholder="Doe" required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="jane@example.com" required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="portfolio">Portfolio / LinkedIn URL</label>
              <input type="url" id="portfolio" name="portfolio" placeholder="https://" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="coverLetter">Cover Letter</label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={6}
                placeholder="Tell us why you're a great fit..."
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Submit Application
            </button>
          </form>
        )}
      </main>

      {/* The Contextual Voice AI Assistant */}
      <ChatOverlay onMessagesChange={handleMessagesChange} />
    </div>
  )
}
