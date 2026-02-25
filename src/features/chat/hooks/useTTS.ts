'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTTSReturn {
  speak: (text: string, voiceId?: string) => Promise<void>
  isPlaying: boolean
  stop: () => void
  analyser: AnalyserNode | null
}

export function useTTS(): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
    }
    return audioContextRef.current
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
  }, [])

  const speak = useCallback(
    async (text: string, voiceId?: string) => {
      stop()

      try {
        setIsPlaying(true)
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId }),
        })

        if (!res.ok) throw new Error(`TTS error ${res.status}`)

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)

        if (!audioRef.current) {
          audioRef.current = new Audio()
          audioRef.current.crossOrigin = 'anonymous'
        }

        const audio = audioRef.current
        audio.src = url

        audio.onended = () => {
          URL.revokeObjectURL(url)
          setIsPlaying(false)
        }

        audio.onerror = () => {
          URL.revokeObjectURL(url)
          setIsPlaying(false)
        }

        const ctx = initAudioContext()
        // Resume context in case it was suspended (browser policy)
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }

        // Only wire up source/analyser once per audio element
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = ctx.createMediaElementSource(audio)
          const newAnalyser = ctx.createAnalyser()
          newAnalyser.fftSize = 64 // relatively low for small UI bars
          sourceNodeRef.current.connect(newAnalyser)
          newAnalyser.connect(ctx.destination)
          setAnalyser(newAnalyser)
        }

        await audio.play()
      } catch (err) {
        console.error('Playback failed', err)
        setIsPlaying(false)
      }
    },
    [stop, initAudioContext],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(console.error)
      }
    }
  }, [])

  return { speak, isPlaying, stop, analyser }
}
