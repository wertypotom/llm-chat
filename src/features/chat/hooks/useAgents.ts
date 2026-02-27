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
  const [agents, setAgents] = useState<Agent[]>([])
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
            voiceId: row.voice_id,
          }))
          setAgents(loadedAgents)
        } else {
          // DB is empty, seed with presets
          const { error: seedError } = await supabase.from('agents').insert(
            PRESET_AGENTS.map((a) => ({
              id: a.id,
              user_id: userId,
              name: a.name,
              system_prompt: a.systemPrompt,
              is_hidden: a.isHidden || false,
              voice_id: a.voiceId,
            })),
          )
          if (seedError) {
            console.error('Failed to seed agents to Supabase:', seedError)
          }
          setAgents(PRESET_AGENTS)
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

  const visibleAgents = agents.filter((a) => !a.isHidden)
  const activeAgent = agents.find((a) => a.id === activeId) ?? agents[0] ?? PRESET_AGENTS[0]

  const saveActive = useCallback((id: string) => {
    setActiveId(id)
    localStorage.setItem(ACTIVE_AGENT_KEY, id)
  }, [])

  const addAgent = useCallback(
    async (agent: Agent) => {
      const next = [...agents, agent]
      setAgents(next)

      const userId = getUserId()
      const { error } = await supabase.from('agents').insert({
        id: agent.id,
        user_id: userId,
        name: agent.name,
        system_prompt: agent.systemPrompt,
        is_hidden: agent.isHidden || false,
        voice_id: agent.voiceId,
      })
      if (error) console.error(error)
    },
    [agents],
  )

  const updateAgent = useCallback(
    async (id: string, updates: Partial<Agent>) => {
      const next = agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
      setAgents(next)

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
            voice_id: agentToUpdate.voiceId,
          },
          { onConflict: 'id' },
        )
        if (error) console.error(error)
      }
    },
    [agents],
  )

  const deleteAgent = useCallback(
    async (id: string) => {
      const next = agents.filter((a) => a.id !== id)
      setAgents(next)
      if (activeId === id) {
        saveActive(PRESET_AGENTS[0].id)
      }

      const { error } = await supabase.from('agents').delete().eq('id', id)
      if (error) console.error(error)
    },
    [agents, activeId, saveActive],
  )

  return {
    isMounted,
    isLoading,
    agents,
    visibleAgents,
    customAgents: agents, // keep for backward compat
    activeAgent,
    activeId,
    setActiveId: saveActive,
    addAgent,
    updateAgent,
    deleteAgent,
  }
}
