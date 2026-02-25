'use client'

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'autoPlayTTS'

interface UseAutoPlayTTSReturn {
  autoPlay: boolean
  toggleAutoPlay: () => void
}

export function useAutoPlayTTS(): UseAutoPlayTTSReturn {
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return { autoPlay, toggleAutoPlay }
}
