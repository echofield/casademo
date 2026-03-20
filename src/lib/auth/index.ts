import { createClient } from '@/lib/supabase/server'
import type { AuthUser, Profile, UserRole } from '@/lib/types'

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
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

  return {
    id: user.id,
    email: user.email!,
    profile,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

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
