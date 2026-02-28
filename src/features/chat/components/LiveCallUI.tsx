'use client'

import { useEffect, useRef } from 'react'
import styles from './LiveCallUI.module.css'

interface Props {
  analyserNode: AnalyserNode | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  isMuted: boolean
  onMute: () => void
  onHangUp: () => void
}

export function LiveCallUI({
  analyserNode,
  isConnected,
  isConnecting,
  error,
  isMuted,
  onMute,
  onHangUp,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>()

  // Draw Audio Visualizer
  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)

      analyserNode.getByteFrequencyData(dataArray)

      // Calculate average volume
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength

      // Calculate a radius based on volume
      const baseRadius = 50
      const pulse = average * 0.8
      const radius = baseRadius + pulse

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw pulsing center
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)

      // Gradient fill based on volume
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius,
        centerX,
        centerY,
        radius,
      )
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)') // Indigo Base
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)') // Fade out

      ctx.fillStyle = gradient
      ctx.fill()

      // Draw solid inner core
      ctx.beginPath()
      ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI)
      ctx.fillStyle = '#4f46e5'
      ctx.fill()
    }

    draw()

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [analyserNode])

  return (
    <div className={styles.overlay}>
      <div className={styles.visualizerContainer}>
        {error ? (
          <p className={styles.errorText}>Connection Error: {error}</p>
        ) : isConnecting ? (
          <div className={styles.connecting}>
            <div className={styles.loader}></div>
            <p>Connecting to AI...</p>
          </div>
        ) : isConnected ? (
          <canvas ref={canvasRef} width={300} height={300} className={styles.canvas} />
        ) : (
          <p className={styles.errorText}>Disconnected</p>
        )}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.iconBtn} ${isMuted ? styles.muted : ''}`}
          onClick={onMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
        <button
          className={`${styles.iconBtn} ${styles.hangup}`}
          onClick={onHangUp}
          title="End Call"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="22" y1="2" x2="2" y2="22" />
          </svg>
        </button>
      </div>
    </div>
  )
}
