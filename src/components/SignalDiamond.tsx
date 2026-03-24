'use client'

import { ClientSignal, SIGNAL_CONFIG } from '@/lib/types/signal'

interface SignalDiamondProps {
  signal: ClientSignal | null
  size?: number // default 14 (px)
}

/**
 * SignalDiamond — Pure SVG diamond glyph for client signal
 *
 * Visual states:
 * - very_hot (Locked): Filled diamond + 8 radiating lines
 * - hot (Strong): Filled diamond only
 * - warm (Open): Diamond outline + bottom half filled
 * - cold (Low): Empty diamond outline
 * - lost (Off): Dashed diamond outline + diagonal strike
 * - null: Dotted circle (not assessed)
 */
export function SignalDiamond({ signal, size = 14 }: SignalDiamondProps) {
  // Calculate half size for diamond points
  const h = size / 2
  const diamondH = h - 1 // Slightly smaller for padding

  if (signal === null) {
    // Null: dotted circle
    return (
      <svg
        width={size}
        height={size}
        viewBox={`${-h} ${-h} ${size} ${size}`}
        className="flex-shrink-0"
        aria-label="Not assessed"
      >
        <circle
          cx="0"
          cy="0"
          r={diamondH - 1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="1.5 2"
          opacity="0.3"
        />
      </svg>
    )
  }

  const color = SIGNAL_CONFIG[signal].color

  switch (signal) {
    case 'very_hot': {
      // Locked: Filled diamond + 8 radiating lines
      const outerR = h * 0.86  // ray outer end
      const innerR = h * 0.57  // ray inner start
      const diagOuter = h * 0.64
      const diagInner = h * 0.43
      return (
        <svg
          width={size}
          height={size}
          viewBox={`${-h} ${-h} ${size} ${size}`}
          className="flex-shrink-0"
          aria-label="Locked"
        >
          {/* 4 cardinal rays */}
          <line x1={-outerR} y1="0" x2={-innerR} y2="0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1={innerR} y1="0" x2={outerR} y2="0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1={-outerR} x2="0" y2={-innerR} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1={innerR} x2="0" y2={outerR} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          {/* 4 diagonal rays */}
          <line x1={-diagOuter} y1={-diagOuter} x2={-diagInner} y2={-diagInner} stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1={diagInner} y1={-diagInner} x2={diagOuter} y2={-diagOuter} stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1={-diagOuter} y1={diagOuter} x2={-diagInner} y2={diagInner} stroke={color} strokeWidth="1" strokeLinecap="round" />
          <line x1={diagInner} y1={diagInner} x2={diagOuter} y2={diagOuter} stroke={color} strokeWidth="1" strokeLinecap="round" />
          {/* Filled diamond */}
          <polygon points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`} fill={color} />
        </svg>
      )
    }

    case 'hot':
      // Strong: Filled diamond only
      return (
        <svg
          width={size}
          height={size}
          viewBox={`${-h} ${-h} ${size} ${size}`}
          className="flex-shrink-0"
          aria-label="Strong"
        >
          <polygon points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`} fill={color} />
        </svg>
      )

    case 'warm':
      // Open: Diamond outline + bottom half filled
      const clipId = `half-${Math.random().toString(36).substr(2, 9)}`
      return (
        <svg
          width={size}
          height={size}
          viewBox={`${-h} ${-h} ${size} ${size}`}
          className="flex-shrink-0"
          aria-label="Open"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={-diamondH} y="0" width={diamondH * 2} height={diamondH} />
            </clipPath>
          </defs>
          <polygon
            points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
          <polygon
            points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`}
            fill={color}
            clipPath={`url(#${clipId})`}
          />
        </svg>
      )

    case 'cold':
      // Low: Empty diamond outline
      return (
        <svg
          width={size}
          height={size}
          viewBox={`${-h} ${-h} ${size} ${size}`}
          className="flex-shrink-0"
          aria-label="Low"
        >
          <polygon
            points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
      )

    case 'lost':
      // Off: Dashed diamond outline + diagonal strike
      return (
        <svg
          width={size}
          height={size}
          viewBox={`${-h} ${-h} ${size} ${size}`}
          className="flex-shrink-0"
          aria-label="Off"
        >
          <polygon
            points={`0,${-diamondH} ${diamondH},0 0,${diamondH} ${-diamondH},0`}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <line
            x1={-diamondH + 2}
            y1={-diamondH + 2}
            x2={diamondH - 2}
            y2={diamondH - 2}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )

    default:
      return null
  }
}
