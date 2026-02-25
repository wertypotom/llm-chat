import { ChangeEvent } from 'react'
import { Agent } from '@/features/chat/types'
import styles from './ModelSelector.module.css'

interface Props {
  agents: Agent[]
  value: string
  onChange: (id: string | 'manage') => void
  disabled?: boolean
}

export function AgentSelector({ agents, value, onChange, disabled }: Props) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <select
      className={styles.select}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label="Select Agent"
      style={{ minWidth: 160 }}
    >
      <optgroup label="Agents">
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Manage">
        <option value="manage">Manage agents...</option>
      </optgroup>
    </select>
  )
}
