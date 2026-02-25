'use client'

import { useState, useEffect, useCallback } from 'react'
import { Agent } from '@/features/chat/types'
import { PRESET_AGENTS } from '@/shared/lib/agents'

const AGENTS_KEY = 'chat:agents'
const ACTIVE_AGENT_KEY = 'chat:activeAgentId'

export function useAgents() {
  const [isMounted, setIsMounted] = useState(false)
  const [customAgents, setCustomAgents] = useState<Agent[]>([])
  const [activeId, setActiveId] = useState<string>(PRESET_AGENTS[0].id)

  useEffect(() => {
    try {
      const savedAgents = localStorage.getItem(AGENTS_KEY)
      if (savedAgents) {
        setCustomAgents(JSON.parse(savedAgents))
      }
      const savedId = localStorage.getItem(ACTIVE_AGENT_KEY)
      if (savedId) {
        setActiveId(savedId)
      }
    } catch {
      // Ignored
    }
    setIsMounted(true)
  }, [])

  const allAgents = [...PRESET_AGENTS, ...customAgents]
  const activeAgent = allAgents.find((a) => a.id === activeId) ?? PRESET_AGENTS[0]

  const saveActive = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_AGENT_KEY, id)
  }, [])

  const addAgent = useCallback(
    (agent: Agent) => {
      const next = [...customAgents, agent]
      setCustomAgents(next)
      localStorage.setItem(AGENTS_KEY, JSON.stringify(next))
    },
    [customAgents],
  )

  const updateAgent = useCallback(
    (id: string, updates: Partial<Agent>) => {
      const next = customAgents.map((a) => (a.id === id ? { ...a, ...updates } : a))
      setCustomAgents(next)
      localStorage.setItem(AGENTS_KEY, JSON.stringify(next))
    },
    [customAgents],
  )

  const deleteAgent = useCallback(
    (id: string) => {
      const next = customAgents.filter((a) => a.id !== id)
      setCustomAgents(next)
      localStorage.setItem(AGENTS_KEY, JSON.stringify(next))
      if (activeId === id) {
        saveActive(PRESET_AGENTS[0].id)
      }
    },
    [customAgents, activeId, saveActive],
  )

  return {
    isMounted,
    agents: allAgents,
    customAgents,
    activeAgent,
    activeId,
    setActiveId: saveActive,
    addAgent,
    updateAgent,
    deleteAgent,
  }
}
