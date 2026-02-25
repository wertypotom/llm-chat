'use client'

import { useState, useRef, useCallback } from 'react'

interface UseTTSReturn {
  speak: (text: string) => Promise<void>
  isPlaying: boolean
  stop: () => void
}

export function useTTS(): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      stop()

      try {
        setIsPlaying(true)
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })

        if (!res.ok) throw new Error(`TTS error ${res.status}`)

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(url)
          setIsPlaying(false)
          audioRef.current = null
        }

        audio.onerror = () => {
          URL.revokeObjectURL(url)
          setIsPlaying(false)
          audioRef.current = null
        }

        await audio.play()
      } catch {
        setIsPlaying(false)
      }
    },
    [stop],
  )

  return { speak, isPlaying, stop }
}
