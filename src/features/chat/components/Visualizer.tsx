'use client'

import React, { useRef, useEffect } from 'react'

interface VisualizerProps {
  analyser: AnalyserNode | null
  isPlaying: boolean
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!analyser || !isPlaying || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Start wiping previous frame with slight trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2 // shrink so it fits

        // Colorful bars based on frequency bin
        const r = barHeight + 25 * (i / bufferLength)
        const g = 250 * (i / bufferLength)
        const b = 255
        ctx.fillStyle = `rgb(${r},${g},${b})`

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [analyser, isPlaying])

  if (!isPlaying) return null

  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={24}
      style={{
        display: 'inline-block',
        marginLeft: '8px',
        verticalAlign: 'middle',
        borderRadius: '4px',
      }}
    />
  )
}
