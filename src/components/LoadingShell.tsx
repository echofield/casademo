import type { ReactNode } from 'react'

/**
 * Minimal chrome for route loading.tsx — matches Nav height and page padding.
 */
export function LoadingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 md:px-8 md:py-4"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)', backgroundColor: 'rgba(247, 244, 238, 0.92)' }}
      >
        <div className="h-6 w-28 animate-pulse rounded bg-bg-soft" />
        <div className="hidden gap-8 md:flex">
          <div className="h-3 w-12 animate-pulse rounded bg-bg-soft" />
          <div className="h-3 w-14 animate-pulse rounded bg-bg-soft" />
          <div className="h-3 w-12 animate-pulse rounded bg-bg-soft" />
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-bg-soft md:hidden" />
      </header>
      <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
