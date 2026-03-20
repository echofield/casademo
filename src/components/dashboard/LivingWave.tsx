'use client'

/**
 * LivingWave - Organic breathing wave animation
 * Inspired by Aura system - responds to team health state
 * Calm when healthy, more agitated when stressed
 */

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface LivingWaveProps {
  /** 0 = calm (healthy team), 1 = agitated (stressed) */
  stress?: number
  /** Primary color for the wave */
  color?: string
  /** Secondary color for depth */
  colorSecondary?: string
  /** Height of the wave container */
  height?: number
  className?: string
}

// Simple seeded noise function for organic movement
function noise(x: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453
  return n - Math.floor(n)
}

// Smoothed noise with interpolation
function smoothNoise(x: number, seed: number): number {
  const x0 = Math.floor(x)
  const x1 = x0 + 1
  const t = x - x0

  // Cubic interpolation for smoothness
  const smoothT = t * t * (3 - 2 * t)

  const n0 = noise(x0, seed)
  const n1 = noise(x1, seed)

  return n0 + smoothT * (n1 - n0)
}

// Multi-octave noise for natural feel
function organicNoise(x: number, seed: number, octaves: number = 3): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, seed + i * 100) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return value / maxValue
}

export function LivingWave({
  stress = 0,
  color = '#0D4A3A',
  colorSecondary = '#2F6B4F',
  height = 80,
  className = '',
}: LivingWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const phaseRef = useRef(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation parameters based on stress level
    const baseAmplitude = 8 + stress * 12 // 8-20px
    const baseFrequency = 0.008 + stress * 0.004 // wave density
    const baseSpeed = 0.0003 + stress * 0.0004 // phase speed

    const draw = (timestamp: number) => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const canvasHeight = rect.height

      ctx.clearRect(0, 0, width, canvasHeight)

      if (reducedMotion) {
        // Static wave for reduced motion
        drawStaticWave(ctx, width, canvasHeight, color, colorSecondary)
        return
      }

      // Update phase
      phaseRef.current = timestamp * baseSpeed

      // Draw multiple wave layers for depth
      const layers = [
        { color: colorSecondary, opacity: 0.15, amplitude: baseAmplitude * 0.6, offset: 0, speed: 1.2 },
        { color: color, opacity: 0.08, amplitude: baseAmplitude * 0.8, offset: Math.PI / 3, speed: 1 },
        { color: color, opacity: 0.12, amplitude: baseAmplitude, offset: Math.PI / 1.5, speed: 0.8 },
      ]

      layers.forEach((layer) => {
        ctx.beginPath()
        ctx.moveTo(0, canvasHeight)

        for (let x = 0; x <= width; x += 2) {
          // Combine multiple noise frequencies for organic feel
          const noiseValue = organicNoise(
            x * baseFrequency + phaseRef.current * layer.speed + layer.offset,
            42, // seed
            3
          )

          // Convert to wave
          const y = canvasHeight * 0.5 + (noiseValue - 0.5) * layer.amplitude * 2

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        // Complete the shape
        ctx.lineTo(width, canvasHeight)
        ctx.lineTo(0, canvasHeight)
        ctx.closePath()

        ctx.fillStyle = layer.color
        ctx.globalAlpha = layer.opacity
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Draw a subtle stroke on the main wave
      ctx.beginPath()
      for (let x = 0; x <= width; x += 2) {
        const noiseValue = organicNoise(
          x * baseFrequency + phaseRef.current * 0.8 + Math.PI / 1.5,
          42,
          3
        )
        const y = canvasHeight * 0.5 + (noiseValue - 0.5) * baseAmplitude * 2

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.2
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [stress, color, colorSecondary, reducedMotion])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Gradient fade at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(247,244,238,1) 0%, transparent 5%, transparent 95%, rgba(247,244,238,1) 100%)',
        }}
      />
    </div>
  )
}

function drawStaticWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  colorSecondary: string
) {
  // Simple static sine wave for reduced motion
  ctx.beginPath()
  ctx.moveTo(0, height)

  for (let x = 0; x <= width; x += 2) {
    const y = height * 0.5 + Math.sin(x * 0.01) * 10
    ctx.lineTo(x, y)
  }

  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()

  ctx.fillStyle = color
  ctx.globalAlpha = 0.08
  ctx.fill()
  ctx.globalAlpha = 1
}
