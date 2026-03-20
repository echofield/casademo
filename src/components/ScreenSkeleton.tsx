import { LoadingShell } from './LoadingShell'

type Variant = 'home' | 'queue' | 'clients' | 'clientDetail' | 'dashboard'

export function ScreenSkeleton({ variant }: { variant: Variant }) {
  return (
    <LoadingShell>
      <div className="mx-auto max-w-6xl animate-pulse">
        {variant === 'home' && <HomeSkeleton />}
        {variant === 'queue' && <QueueSkeleton />}
        {variant === 'clients' && <ClientsSkeleton />}
        {variant === 'clientDetail' && <ClientDetailSkeleton />}
        {variant === 'dashboard' && <DashboardSkeleton />}
      </div>
    </LoadingShell>
  )
}

function Block({ className }: { className: string }) {
  return <div className={`rounded bg-bg-soft ${className}`} />
}

function HomeSkeleton() {
  return (
    <div className="max-w-4xl">
      <Block className="mb-2 h-10 w-2/3" />
      <Block className="mb-10 h-4 w-1/3" />
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Block className="h-20" />
        <Block className="h-20" />
        <Block className="h-20" />
        <Block className="h-20" />
      </div>
      <Block className="mb-4 h-12 w-full max-w-md" />
      <Block className="mb-2 h-3 w-24" />
      <Block className="h-24 w-full" />
      <Block className="mt-4 h-24 w-full" />
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div className="max-w-2xl">
      <Block className="mb-2 h-9 w-4/5" />
      <Block className="mb-2 h-4 w-32" />
      <Block className="mb-4 h-1 w-full" />
      <div className="border bg-surface p-8" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
        <Block className="mb-4 h-8 w-3/5" />
        <Block className="mb-6 h-3 w-24" />
        <Block className="mb-4 h-4 w-40" />
        <div className="flex gap-3">
          <Block className="h-12 flex-1" />
          <Block className="h-12 w-20" />
        </div>
      </div>
    </div>
  )
}

function ClientsSkeleton() {
  return (
    <>
      <Block className="mb-2 h-10 w-48" />
      <Block className="mb-8 h-4 w-64" />
      <Block className="mb-6 h-10 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border bg-surface p-5"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <Block className="mb-3 h-5 w-3/4" />
            <Block className="mb-2 h-3 w-1/2" />
            <Block className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </>
  )
}

function ClientDetailSkeleton() {
  return (
    <div className="max-w-4xl">
      <Block className="mb-6 h-4 w-32" />
      <div className="mb-8 border bg-surface p-6" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
        <Block className="mb-4 h-10 w-2/3" />
        <Block className="mb-6 h-6 w-40" />
        <Block className="h-4 w-full max-w-sm" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Block key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <Block className="mb-3 h-4 w-28" />
      <Block className="mb-2 h-12 w-full max-w-2xl" />
      <Block className="mb-10 h-4 w-full max-w-lg" />
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Block className="h-24" />
        <Block className="h-24" />
        <Block className="h-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Block className="h-64" />
        <Block className="h-64" />
      </div>
    </>
  )
}
