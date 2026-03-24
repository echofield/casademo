'use client'

/**
 * LearnerProfile - Aura-inspired dot visualization for learner state
 * Shows dimensions as dots (●●●○○○) instead of raw numbers
 * Casa One aesthetic: warm, muted, professional
 */

interface ProfileData {
  engagement: number    // 0-100
  comprehension: number
  retention: number
  initiative: number
  gaps: number
}

interface LearnerProfileProps {
  data: ProfileData
  className?: string
}

type Dimension = {
  key: keyof ProfileData
  label: string
  color: string
  inverted?: boolean
}

const DIMENSIONS: Dimension[] = [
  { key: 'engagement', label: 'Engagement', color: '#0D4A3A' },
  { key: 'comprehension', label: 'Compréhension', color: '#0D4A3A' },
  { key: 'retention', label: 'Rétention', color: '#2F6B4F' },
  { key: 'initiative', label: 'Initiative', color: '#A48763' },
  { key: 'gaps', label: 'Lacunes', color: '#C34747', inverted: true },
]

function pointsToDots(points: number, max = 100): number {
  const ratio = points / max
  if (ratio >= 0.9) return 6
  if (ratio >= 0.75) return 5
  if (ratio >= 0.6) return 4
  if (ratio >= 0.4) return 3
  if (ratio >= 0.2) return 2
  if (ratio > 0) return 1
  return 0
}

function DotRow({ filled, total = 6, color }: { filled: number; total?: number; color: string }) {
  return (
    <div className="flex gap-1 justify-center mt-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: i < filled ? color : 'transparent',
            border: `1px solid ${i < filled ? color : 'rgba(28, 27, 25, 0.15)'}`,
          }}
        />
      ))}
    </div>
  )
}

function getInterpretation(dominant: string): string {
  switch (dominant) {
    case 'engagement':
      return "Attention is there. The rest will follow."
    case 'comprehension':
      return "Understanding is taking hold."
    case 'retention':
      return "Knowledge is taking root."
    case 'initiative':
      return "Autonomy is developing."
    case 'gaps':
      return "Some areas need attention."
    default:
      return "Profile under construction."
  }
}

export function LearnerProfile({ data, className = '' }: LearnerProfileProps) {
  // Find dominant dimension (excluding gaps for positive framing)
  const positiveValues = Object.entries(data).filter(([k]) => k !== 'gaps') as [string, number][]
  const dominant = positiveValues.reduce((a, b) => b[1] > a[1] ? b : a)[0]

  return (
    <div
      className={`bg-surface p-6 ${className}`}
      style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      <div className="label text-text-muted mb-6">PROFIL APPRENANT</div>

      <div className="flex gap-6 justify-center flex-wrap">
        {DIMENSIONS.map((dim) => {
          const value = data[dim.key]
          const dots = pointsToDots(dim.inverted ? 100 - value : value)
          const isDominant = dim.key === dominant

          return (
            <div
              key={dim.key}
              className="text-center"
              style={{ opacity: isDominant ? 1 : 0.7 }}
            >
              <span
                className="text-[10px] tracking-[0.05em] block"
                style={{
                  fontWeight: isDominant ? 600 : 400,
                  color: '#6E685F',
                }}
              >
                {dim.label}
              </span>
              <DotRow filled={dots} total={6} color={dim.color} />
            </div>
          )
        })}
      </div>

      {/* Poetic interpretation - human-readable, not esoteric */}
      <p
        className="text-center mt-6 font-serif text-sm italic"
        style={{ color: '#1C1B19', opacity: 0.7, lineHeight: 1.5 }}
      >
        {getInterpretation(dominant)}
      </p>
    </div>
  )
}
