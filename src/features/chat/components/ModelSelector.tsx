'use client'

import { ChangeEvent } from 'react'
import { AIModel } from '@/shared/lib/models'
import styles from './ModelSelector.module.css'

interface Props {
  models: AIModel[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function ModelSelector({ models, value, onChange, disabled }: Props) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <select
      className={styles.select}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label="Select AI Model"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}
