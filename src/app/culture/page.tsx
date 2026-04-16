import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components'
import { CulturePage } from './CulturePage'

export const metadata = {
  title: 'Culture — Casa One',
}

export default async function CultureRoute() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <AppShell
      userRole={user.profile.role}
      effectiveRole={user.effectiveRole}
      userName={user.profile.full_name}
    >
      <CulturePage />
    </AppShell>
  )
}
