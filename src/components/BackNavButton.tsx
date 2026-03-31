'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackNavButtonProps {
  fallbackHref: string
  label: string
  className?: string
}

function canNavigateBack(): boolean {
  if (typeof window === 'undefined') return false
  if (window.history.length <= 1) return false
  if (!document.referrer) return false

  try {
    const referrerUrl = new URL(document.referrer)
    return referrerUrl.origin === window.location.origin
  } catch {
    return false
  }
}

export function BackNavButton({ fallbackHref, label, className = '' }: BackNavButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (canNavigateBack()) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm text-text-muted transition-colors duration-200 hover:text-text ${className}`}
      aria-label={`Back to ${label}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )
}