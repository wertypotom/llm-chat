'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatSession } from '@/features/chat/types'

interface UseWebRTCReturn {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  startCall: () => Promise<void>
  stopCall: () => void
  toggleMute: () => void
  isMuted: boolean
  analyserNode: AnalyserNode | null // For UI Audio Visualization
}

interface UseWebRTCProps {
  onTranscript?: (role: 'user' | 'assistant', text: string) => void
  onMessagesChange?: (messages: ChatSession['messages']) => void
  pageContextFn?: () => Record<string, any>
}

export function useWebRTC({
  onTranscript,
  onMessagesChange,
  pageContextFn,
}: UseWebRTCProps): UseWebRTCReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // AudioContext for Visualizer
  const audioCtxRef = useRef<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  // Keep latest callbacks in refs to avoid stale closures during the long-lived WebRTC connection
  const onTranscriptRef = useRef(onTranscript)
  const pageContextFnRef = useRef(pageContextFn)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
    pageContextFnRef.current = pageContextFn
  }, [onTranscript, pageContextFn])

  const stopCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    setAnalyserNode(null)
    setIsConnected(false)
    setIsConnecting(false)
    setIsMuted(false)
  }, [])

  const startCall = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // 1. Get ephemeral token
      const tokenRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: pageContextFn
            ? 'You are a helpful assistant guiding the user through a job application form. I will send you JSON payload updates indicating which fields on the form are currently filled and which are empty. You should politely guide the user, tell them what is missing, and answer questions. Keep your responses extremely concise and conversational, as you are on a live phone call. Do not use markdown.'
            : undefined,
        }),
      })

      if (!tokenRes.ok) throw new Error('Failed to get session token')
      const { client_secret } = await tokenRes.json()

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Audio Setup (Playback)
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioElRef.current = audioEl

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]

        // Connect specific audio stream to Web Audio API for visualization
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioCtxRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        const source = audioCtx.createMediaStreamSource(e.streams[0])
        source.connect(analyser)
        setAnalyserNode(analyser)
      }

      // 4. Capture Mic
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = ms
      pc.addTrack(ms.getTracks()[0])

      // 5. Data Channel for contexts and transcripts
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        // Send initial context
        if (pageContextFnRef.current) {
          const context = pageContextFnRef.current()
          dc.send(
            JSON.stringify({
              type: 'session.update',
              session: {
                instructions: `You are a helpful assistant guiding the user through a job application form. Current form state: ${JSON.stringify(context)}. Give very short answers.`,
              },
            }),
          )
        }
      }

      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          // Handle transcripts sent by OpenAI over WebRTC
          if (event.type === 'response.audio_transcript.done' && onTranscriptRef.current) {
            onTranscriptRef.current('assistant', event.transcript)
          }
          if (
            event.type === 'conversation.item.input_audio_transcription.completed' &&
            onTranscriptRef.current
          ) {
            onTranscriptRef.current('user', event.transcript)
          }
        } catch (err) {
          console.error('Failed to parse data channel message:', err)
        }
      }

      // 6. WebRTC SDP Negotiation
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const baseUrl = 'https://api.openai.com/v1/realtime'
      const model = 'gpt-4o-realtime-preview-2024-12-17'

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${client_secret}`,
          'Content-Type': 'application/sdp',
        },
      })

      if (!sdpResponse.ok) {
        throw new Error('OpenAI SDP generation failed')
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Call failed')
      stopCall()
    }
  }, [stopCall])

  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCall()
    }
  }, [stopCall])

  return {
    isConnected,
    isConnecting,
    error,
    startCall,
    stopCall,
    toggleMute,
    isMuted,
    analyserNode,
  }
}
