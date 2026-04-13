import { LoadingShell } from './LoadingShell'

type Variant = 'home' | 'queue' | 'clients' | 'clientDetail' | 'dashboard' | 'calendar' | 'team'

export function ScreenSkeleton({ variant }: { variant: Variant }) {
  return (
    <LoadingShell>
      <div className="mx-auto max-w-6xl animate-fade-in">
        {variant === 'home' && <HomeSkeleton />}
        {variant === 'queue' && <QueueSkeleton />}
        {variant === 'clients' && <ClientsSkeleton />}
        {variant === 'clientDetail' && <ClientDetailSkeleton />}
        {variant === 'dashboard' && <DashboardSkeleton />}
        {variant === 'calendar' && <CalendarSkeleton />}
        {variant === 'team' && <TeamSkeleton />}
      </div>
    </LoadingShell>
  )
}

function Block({ className }: { className: string }) {
  return <div className={`skeleton-block ${className}`} />
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border bg-surface p-5 md:p-6 ${className}`} style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      {children}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="max-w-4xl">
      <Block className="mb-3 h-3 w-24" />
      <Block className="mb-2 h-11 w-2/3" />
      <Block className="mb-10 h-4 w-1/3" />
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Block className="mb-3 h-3 w-16" />
            <Block className="h-9 w-12" />
          </Card>
        ))}
      </div>
      <Card className="mb-6">
        <Block className="mb-4 h-3 w-16" />
        <div className="space-y-3">
          <Block className="h-12 w-full" />
          <Block className="h-12 w-full" />
        </div>
      </Card>
      <Card>
        <Block className="mb-3 h-3 w-24" />
        <Block className="mb-4 h-8 w-2/3" />
        <Block className="h-14 w-full" />
      </Card>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div className="max-w-2xl">
      <Block className="mb-2 h-9 w-4/5" />
      <Block className="mb-8 h-4 w-32" />
      <Card>
        <Block className="mb-4 h-8 w-3/5" />
        <Block className="mb-6 h-3 w-24" />
        <Block className="mb-4 h-12 w-full" />
        <div className="flex gap-3">
          <Block className="h-11 flex-1" />
          <Block className="h-11 w-24" />
        </div>
      </Card>
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
          <Card key={i}>
            <Block className="mb-4 h-5 w-3/4" />
            <Block className="mb-2 h-3 w-1/2" />
            <Block className="mb-5 h-3 w-2/3" />
            <div className="flex gap-2">
              <Block className="h-6 w-16 rounded-full" />
              <Block className="h-6 w-20 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

function ClientDetailSkeleton() {
  return (
    <div className="max-w-4xl">
      <Block className="mb-6 h-4 w-32" />
      <Card className="mb-8">
        <Block className="mb-4 h-10 w-2/3" />
        <Block className="mb-6 h-6 w-40" />
        <Block className="h-4 w-full max-w-sm" />
      </Card>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Block className="mb-3 h-4 w-24" />
            <Block className="h-12 w-full" />
          </Card>
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
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <Block className="mb-3 h-3 w-20" />
            <Block className="h-10 w-20" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Block className="mb-4 h-4 w-28" />
          <Block className="h-56 w-full" />
        </Card>
        <Card>
          <Block className="mb-4 h-4 w-24" />
          <Block className="h-56 w-full" />
        </Card>
      </div>
    </>
  )
}

function CalendarSkeleton() {
  return (
    <>
      <Block className="mb-3 h-4 w-20" />
      <Block className="mb-8 h-10 w-40" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <Block className="h-10 w-10" />
          <Block className="h-10 w-10" />
          <Block className="h-10 w-20" />
        </div>
        <div className="flex gap-2">
          <Block className="h-10 w-20" />
          <Block className="h-10 w-20" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Block className="mb-2 h-5 w-48" />
                <Block className="h-4 w-32" />
              </div>
              <Block className="h-8 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

function TeamSkeleton() {
  return (
    <>
      <Block className="mb-3 h-4 w-16" />
      <Block className="mb-8 h-10 w-24" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="mb-4 flex items-center gap-4">
              <Block className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Block className="mb-2 h-5 w-32" />
                <Block className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Block className="h-16" />
              <Block className="h-16" />
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
