import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { AuthUser, Profile, UserRole } from '@/lib/types'

export const VIEW_MODE_COOKIE = 'casa_view_mode'

type GetCurrentUserOptions = {
  includeInactive?: boolean
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function getCurrentUser(options: GetCurrentUserOptions = {}): Promise<AuthUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  if (!profile.active && !options.includeInactive) {
    return null
  }

  let effectiveRole: UserRole = profile.role
  if (profile.role === 'supervisor') {
    const cookieStore = await cookies()
    const viewMode = cookieStore.get(VIEW_MODE_COOKIE)?.value
    if (viewMode === 'seller') {
      effectiveRole = 'seller'
    }
  }

  return {
    id: user.id,
    email: user.email!,
    profile,
    effectiveRole,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser({ includeInactive: true })

  if (!user) {
    throw new AuthError('Authentication required', 401)
  }

  if (!user.profile.active) {
    throw new AuthError('Account is deactivated', 403)
  }

  return user
}

export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth()

  if (user.profile.role !== role) {
    throw new AuthError(`Requires ${role} role`, 403)
  }

  return user
}

export async function requireSupervisor(): Promise<AuthUser> {
  return requireRole('supervisor')
}

export function isSupervisor(profile: Profile): boolean {
  return profile.role === 'supervisor'
}
