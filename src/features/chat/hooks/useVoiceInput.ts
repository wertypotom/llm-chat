'use client'

import { useState, useRef, useCallback } from 'react'

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }, [])

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(null)
        return
      }

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        audioChunks.current = []

        // Stop all tracks
        mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        setIsTranscribing(true)

        try {
          const formData = new FormData()
          // Whisper accepts webm, mp3, mp4, etc. WebM is standard for browser MediaRecorder
          formData.append('file', audioBlob, 'audio.webm')

          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) throw new Error('Transcription failed')

          const data = await res.json()
          resolve(data.text)
        } catch (err) {
          console.error('STT fetch error:', err)
          resolve(null)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.current.stop()
    })
  }, [])

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  }
}
