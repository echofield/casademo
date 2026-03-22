'use client'

/**
 * CornerBrackets - SYMI signature micro-detail
 * Adds subtle corner bracket accents to cards
 */

interface CornerBracketsProps {
  /** Size of the bracket */
  size?: 'sm' | 'md' | 'lg'
  /** Opacity of the brackets (0-1) */
  opacity?: number
  /** Color of the brackets */
  color?: string
  /** Only show specific corners */
  corners?: ('tl' | 'tr' | 'bl' | 'br')[]
  className?: string
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function CornerBrackets({
  size = 'md',
  opacity = 0.3,
  color = 'var(--green)',
  corners = ['tl', 'tr', 'bl', 'br'],
  className = '',
}: CornerBracketsProps) {
  const sizeClass = sizeMap[size]
  const style = { borderColor: color, opacity }

  return (
    <>
      {/* Top-left bracket */}
      {corners.includes('tl') && (
        <div
          className={`absolute -top-px -left-px ${sizeClass} border-l border-t ${className}`}
          style={style}
          aria-hidden="true"
        />
      )}

      {/* Top-right bracket */}
      {corners.includes('tr') && (
        <div
          className={`absolute -top-px -right-px ${sizeClass} border-r border-t ${className}`}
          style={style}
          aria-hidden="true"
        />
      )}

      {/* Bottom-left bracket */}
      {corners.includes('bl') && (
        <div
          className={`absolute -bottom-px -left-px ${sizeClass} border-l border-b ${className}`}
          style={style}
          aria-hidden="true"
        />
      )}

      {/* Bottom-right bracket */}
      {corners.includes('br') && (
        <div
          className={`absolute -bottom-px -right-px ${sizeClass} border-r border-b ${className}`}
          style={style}
          aria-hidden="true"
        />
      )}
    </>
  )
}

/**
 * CardWithBrackets - A card with corner brackets built in
 */
interface CardWithBracketsProps {
  children: React.ReactNode
  className?: string
  bracketSize?: 'sm' | 'md' | 'lg'
  bracketOpacity?: number
  elevated?: boolean
}

export function CardWithBrackets({
  children,
  className = '',
  bracketSize = 'md',
  bracketOpacity = 0.3,
  elevated = false,
}: CardWithBracketsProps) {
  return (
    <div
      className={`relative p-6 ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
        boxShadow: elevated ? '0 40px 80px rgba(27, 67, 50, 0.08)' : undefined,
      }}
    >
      <CornerBrackets size={bracketSize} opacity={bracketOpacity} />
      {children}
    </div>
  )
}
