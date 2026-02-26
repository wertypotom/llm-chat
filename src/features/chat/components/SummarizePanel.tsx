'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './SummarizePanel.module.css'

type State = 'idle' | 'loading' | 'done' | 'error'

export function SummarizePanel() {
  const [state, setState] = useState<State>('idle')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit(file: File) {
    setFileName(file.name)
    setState('loading')
    setSummary('')
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/summarize', { method: 'POST', body: form })
      const data = (await res.json()) as { summary?: string; error?: string }
      if (!res.ok || !data.summary) throw new Error(data.error ?? 'Unknown error')
      setSummary(data.summary)
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to summarize')
      setState('error')
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    submit(file)
  }

  return (
    <div className={styles.panel}>
      <p className={styles.hint}>Upload a PDF or text file to summarize using AI map-reduce.</p>

      {/* Drop zone */}
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Drop file or click to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFiles(e.dataTransfer.files)
        }}
      >
        <span className={styles.dropIcon}>📄</span>
        <span>{dragging ? 'Drop it!' : 'Drag & drop or click to browse'}</span>
        <span className={styles.subHint}>PDF or .txt · any size</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className={styles.hiddenInput}
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {/* Status */}
      {state === 'loading' && (
        <div className={styles.status}>
          <span className={styles.spinner} aria-hidden="true" />
          Summarizing <strong>{fileName}</strong>… this may take a minute.
        </div>
      )}

      {state === 'error' && (
        <div className={`${styles.status} ${styles.statusError}`}>⚠ {error}</div>
      )}

      {state === 'done' && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span>
              Summary of <strong>{fileName}</strong>
            </span>
            <button
              className={styles.copyBtn}
              onClick={() => navigator.clipboard.writeText(summary)}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <div className={styles.markdown}>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
