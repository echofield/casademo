import { Nav } from './Nav'

interface AppShellProps {
  children: React.ReactNode
  userRole: 'seller' | 'supervisor'
  userName: string
}

export function AppShell({ children, userRole, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <Nav userRole={userRole} userName={userName} />
      <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
