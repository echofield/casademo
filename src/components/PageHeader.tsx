import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="heading-1 text-text">{title}</h1>

      {subtitle && (
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      )}

      {actions && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}
