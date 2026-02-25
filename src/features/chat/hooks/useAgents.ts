'use client'

import { useState, useEffect, useCallback } from 'react'
import { Agent } from '@/features/chat/types'
import { PRESET_AGENTS } from '@/shared/lib/agents'
import { getUserId } from '@/features/chat/lib/storage'
import { supabase } from '@/shared/lib/supabase'

const ACTIVE_AGENT_KEY = 'chat:activeAgentId'

export function useAgents() {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customAgents, setCustomAgents] = useState<Agent[]>([])
  const [activeId, setActiveId] = useState<string>(PRESET_AGENTS[0].id)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const userId = getUserId()
        const { data } = await supabase.from('agents').select('*').eq('user_id', userId)

        if (data && data.length > 0) {
          const loadedAgents = data.map((row) => ({
            id: row.id,
            name: row.name,
            systemPrompt: row.system_prompt,
            isHidden: row.is_hidden,
          }))
          setCustomAgents(loadedAgents)
        }

        const savedId = localStorage.getItem(ACTIVE_AGENT_KEY)
        if (savedId) {
          setActiveId(savedId)
        }
      } catch (err) {
        console.error('Failed to load agents from Supabase:', err)
      } finally {
        setIsLoading(false)
        setIsMounted(true)
      }
    }
    fetchAgents()
  }, [])

  const allAgents = [...PRESET_AGENTS, ...customAgents]
  const visibleAgents = allAgents.filter((a) => !a.isHidden)
  const activeAgent = allAgents.find((a) => a.id === activeId) ?? PRESET_AGENTS[0]

  const saveActive = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_AGENT_KEY, id)
  }, [])

  const addAgent = useCallback(
    async (agent: Agent) => {
      const next = [...customAgents, agent]
      setCustomAgents(next)

      const userId = getUserId()
      const { error } = await supabase.from('agents').insert({
        id: agent.id,
        user_id: userId,
        name: agent.name,
        system_prompt: agent.systemPrompt,
        is_hidden: agent.isHidden || false,
      })
      if (error) console.error(error)
    },
    [customAgents],
  )

  const updateAgent = useCallback(
    async (id: string, updates: Partial<Agent>) => {
      const next = customAgents.map((a) => (a.id === id ? { ...a, ...updates } : a))
      setCustomAgents(next)

      const userId = getUserId()
      const agentToUpdate = next.find((a) => a.id === id)
      if (agentToUpdate) {
        const { error } = await supabase.from('agents').upsert(
          {
            id: agentToUpdate.id,
            user_id: userId,
            name: agentToUpdate.name,
            system_prompt: agentToUpdate.systemPrompt,
            is_hidden: agentToUpdate.isHidden || false,
          },
          { onConflict: 'id' },
        )
        if (error) console.error(error)
      }
    },
    [customAgents],
  )

  const deleteAgent = useCallback(
    async (id: string) => {
      const next = customAgents.filter((a) => a.id !== id)
      setCustomAgents(next)
      if (activeId === id) {
        saveActive(PRESET_AGENTS[0].id)
      }

      const { error } = await supabase.from('agents').delete().eq('id', id)
      if (error) console.error(error)
    },
    [customAgents, activeId, saveActive],
  )

  return {
    isMounted,
    isLoading,
    agents: allAgents,
    visibleAgents,
    customAgents,
    activeAgent,
    activeId,
    setActiveId: saveActive,
    addAgent,
    updateAgent,
    deleteAgent,
  }
}
