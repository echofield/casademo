import type { ReactNode } from 'react'

/**
 * Route-loading chrome that matches the app shell and keeps a visible frame in place.
 */
export function LoadingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: 'rgba(28, 27, 25, 0.08)',
          backgroundColor: 'rgba(250, 248, 242, 0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="skeleton-block h-7 w-7 rounded-full" />
              <div className="skeleton-block h-7 w-7 rounded-full" />
            </div>
            <div className="skeleton-block h-6 w-28" />
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <div className="skeleton-block h-3 w-12" />
            <div className="skeleton-block h-3 w-14" />
            <div className="skeleton-block h-3 w-12" />
            <div className="skeleton-block h-3 w-16" />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-3 w-20 skeleton-block md:block" />
            <div className="skeleton-block h-8 w-8 rounded-full" />
          </div>
        </div>

        <div className="h-[2px] w-full bg-[#003D2B]/8">
          <div className="h-full w-2/5 animate-pulse bg-[#003D2B]" />
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
          <div>
            <p className="loading-copy mb-2">Opening workspace</p>
            <div className="skeleton-block h-4 w-40" />
          </div>
          <div className="hidden h-9 w-28 skeleton-block md:block" />
        </div>
        {children}
      </main>
    </div>
  )
}
