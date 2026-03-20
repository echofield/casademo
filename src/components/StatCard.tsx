interface StatCardProps {
  label: string
  value: string | number
  tone?: 'default' | 'danger' | 'success' | 'gold'
  detail?: string
}

export function StatCard({ label, value, tone = 'default', detail }: StatCardProps) {
  const toneStyles = {
    default: 'text-text',
    danger: 'text-danger',
    success: 'text-success',
    gold: 'text-gold',
  }

  return (
    <div className="bg-surface p-5" style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}>
      <div className="label text-text-muted mb-2">
        {label}
      </div>

      <div className={`metric ${toneStyles[tone]}`}>
        {value}
      </div>

      {detail && (
        <div className="mt-1 text-xs text-text-muted">
          {detail}
        </div>
      )}
    </div>
  )
}
