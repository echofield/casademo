// Casa One Motion Tokens
// Philosophy: composed, not alive. Damped, not bouncy.

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
