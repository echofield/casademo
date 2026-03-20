// Casa One Motion Tokens
// Philosophy: composed, not alive. Damped, not bouncy.
// Extended with instrument-style tokens from Aura system

// Named duration tokens (no raw ms in components)
export const durations = {
  instant: 90,
  brisk: 200,
  measured: 400,
  contemplative: 1000,
  ambient: 60000,
} as const

// Named easing functions
export const easings = {
  appear: 'cubic-bezier(0, 0, 0.2, 1)',
  transition: 'cubic-bezier(0.4, 0, 0.2, 1)',
  dismiss: 'cubic-bezier(0.4, 0, 1, 1)',
  continuous: 'linear',
} as const

// Helper to get duration by name
export function t(speed: keyof typeof durations): number {
  return durations[speed]
}

// Helper to get easing by name
export function ease(kind: keyof typeof easings): string {
  return easings[kind]
}

// Clamp value between 0 and 1
export function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

// Cubic bezier interpolation for animations
export function interpolate(kind: keyof typeof easings, progress: number): number {
  const p = clamp01(progress)
  if (kind === 'continuous') return p

  // Cubic bezier approximation
  const bezierAt = (x1: number, y1: number, x2: number, y2: number, t: number): number => {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    return ((ay * t + by) * t + cy) * t
  }

  if (kind === 'appear') return bezierAt(0, 0, 0.2, 1, p)
  if (kind === 'transition') return bezierAt(0.4, 0, 0.2, 1, p)
  return bezierAt(0.4, 0, 1, 1, p) // dismiss
}

// Check for reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const transitions = {
  // Main spring - luxury weight, heavily damped
  spring: {
    type: "spring" as const,
    stiffness: 120,
    damping: 26,
  },

  // Layout animations - list reorder, filter
  layout: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
  },

  // Simple fade - page transitions
  fade: {
    duration: 0.2,
    ease: "easeOut" as const,
  },

  // Subtle enter - elements appearing
  enter: {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  },
}

// Animation variants for common patterns
export const variants = {
  // Fade in from below (subtle)
  fadeUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },

  // Simple fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Scale in (very subtle)
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },

  // Stagger children
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
}

// Tier colors for state tonality
export const tierAccents = {
  rainbow: 'rgba(28, 27, 25, 0.15)',
  optimisto: 'rgba(28, 27, 25, 0.2)',
  kaizen: 'rgba(13, 74, 58, 0.3)',
  idealiste: 'rgba(13, 74, 58, 0.4)',
  diplomatico: 'rgba(164, 135, 99, 0.4)',
  grand_prix: 'rgba(164, 135, 99, 0.6)',
}

export const tierBorders = {
  rainbow: '#9CA3AF',
  optimisto: '#6E685F',
  kaizen: '#0D4A3A',
  idealiste: '#0D4A3A',
  diplomatico: '#A48763',
  grand_prix: '#A48763',
}
