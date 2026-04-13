import { Nav } from './Nav'
import { RouteWarmup } from './RouteWarmup'

interface AppShellProps {
  children: React.ReactNode
  userRole: 'seller' | 'supervisor'
  effectiveRole?: 'seller' | 'supervisor'
  userName: string
}

export function AppShell({ children, userRole, effectiveRole, userName }: AppShellProps) {
  const resolvedRole = effectiveRole ?? userRole

  return (
    <div className="min-h-screen bg-bg">
      <RouteWarmup effectiveRole={resolvedRole} />
      <Nav userRole={userRole} effectiveRole={resolvedRole} userName={userName} />
      <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
