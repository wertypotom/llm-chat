'use client'

import { create } from 'zustand'

interface TTSState {
  isPlaying: boolean
  playingId: string | null
  analyser: AnalyserNode | null
  speak: (text: string, messageId: string, voiceId?: string) => Promise<void>
  stop: () => void
}

// Module-level audio primitives so they are true singletons
let audioContext: AudioContext | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let audioEl: HTMLAudioElement | null = null
let currentUrl: string | null = null

const initAudio = () => {
  if (typeof window === 'undefined') return { ctx: null, audio: null, analyser: null }

  if (!audioEl) {
    audioEl = new Audio()
    audioEl.crossOrigin = 'anonymous'
  }

  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    audioContext = new AudioContextClass()
  }

  let analyser: AnalyserNode | null = null
  if (!sourceNode && audioContext) {
    sourceNode = audioContext.createMediaElementSource(audioEl)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    sourceNode.connect(analyser)
    analyser.connect(audioContext.destination)
  }

  return { ctx: audioContext, audio: audioEl, analyser }
}

export const useTTS = create<TTSState>()((set, get) => ({
  isPlaying: false,
  playingId: null,
  analyser: null,

  stop: () => {
    if (audioEl) {
      audioEl.pause()
      audioEl.currentTime = 0
    }
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl)
      currentUrl = null
    }
    set({ isPlaying: false, playingId: null })
  },

  speak: async (text: string, messageId: string, voiceId?: string) => {
    const { stop } = get()
    stop()

    try {
      set({ isPlaying: true, playingId: messageId })

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      })

      if (!res.ok) throw new Error(`TTS error ${res.status}`)

      const blob = await res.blob()

      // Stop execution if user clicked Stop while we were fetching
      if (get().playingId !== messageId) {
        return
      }

      const url = URL.createObjectURL(blob)

      const { ctx, audio, analyser: newAnalyser } = initAudio()
      if (!audio || !ctx) {
        URL.revokeObjectURL(url)
        throw new Error('Audio not supported')
      }

      // If we created a new analyser node, save it to state
      if (newAnalyser) {
        set({ analyser: newAnalyser })
      }

      currentUrl = url
      audio.src = url

      audio.onended = () => {
        if (currentUrl === url) {
          URL.revokeObjectURL(url)
          currentUrl = null
          set({ isPlaying: false, playingId: null })
        }
      }

      audio.onerror = () => {
        if (currentUrl === url) {
          URL.revokeObjectURL(url)
          currentUrl = null
          set({ isPlaying: false, playingId: null })
        }
      }

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      await audio.play()
    } catch (err) {
      console.error('Playback failed', err)
      if (get().playingId === messageId) {
        set({ isPlaying: false, playingId: null })
      }
    }
  },
}))
