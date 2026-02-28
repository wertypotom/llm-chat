'use client'

import { useState } from 'react'
import { ChatOverlay } from '@/features/chat/components/ChatOverlay'
import styles from './page.module.css'

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}></div>
        <h1>Acme Corp Careers</h1>
        <p>Apply to join our mission-driven team.</p>
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
      <ChatOverlay />
    </div>
  )
}
