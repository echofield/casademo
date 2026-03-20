import { Nav } from './Nav'

interface AppShellProps {
  children: React.ReactNode
  userRole: 'seller' | 'supervisor'
  userName: string
}

export function AppShell({ children, userRole, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper">
      <Nav userRole={userRole} userName={userName} />
      <main className="px-4 md:px-8 py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
