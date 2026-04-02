import { createClient } from '@/lib/supabase/server'
import { AuthError, requireSupervisor } from '@/lib/auth'
import {
  createPostClientDsarHandler,
  type DsarClientRecord,
  type PostClientDsarDeps,
} from './post-handler'

class DsarRouteError extends Error {
  constructor(
    message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'DsarRouteError'
  }
}

const defaultDeps: PostClientDsarDeps = {
  requireSupervisor: async () => {
    const user = await requireSupervisor()
    return { id: user.id }
  },
  loadClient: async (clientId: string): Promise<DsarClientRecord | null> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, birthday, notes')
      .eq('id', clientId)
      .maybeSingle()

    if (error) {
      throw new DsarRouteError(`Failed to load client: ${error.message}`, 500)
    }

    return data as DsarClientRecord | null
  },
  anonymizeClient: async (clientId, updates) => {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clients')
      .update(updates as any)
      .eq('id', clientId)

    return {
      error: error ? { message: error.message } : null,
    }
  },
  writeAuditEvent: async (event) => {
    const supabase = await createClient()
    const { error } = await (supabase as any).from('dsar_audit_log').insert(event)

    return {
      error: error ? { message: error.message } : null,
    }
  },
  now: () => new Date().toISOString(),
  isAuthError: (err: unknown): err is AuthError => err instanceof AuthError,
}

// POST /api/clients/[id]/dsar - supervisor-only client anonymization
export const POST = createPostClientDsarHandler(defaultDeps)
