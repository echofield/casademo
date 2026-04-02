import { createClient } from '@/lib/supabase/server'
import { AuthError, requireSupervisor } from '@/lib/auth'
import {
  createGetClientExportHandler,
  type ClientExportData,
  type ExportRecord,
  type GetClientExportDeps,
} from './get-handler'

type QueryResult = {
  data: unknown
  error: { message: string; code?: string | null } | null
}

class ExportRouteError extends Error {
  constructor(
    message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'ExportRouteError'
  }
}

function normalizeRows(data: unknown): ExportRecord[] {
  return Array.isArray(data) ? (data as ExportRecord[]) : []
}

function isMissingRelationError(error: { message: string; code?: string | null }) {
  const message = error.message.toLowerCase()
  return (
    error.code === '42P01' ||
    (message.includes('relation') && message.includes('does not exist'))
  )
}

function requiredRows(result: QueryResult, label: string): ExportRecord[] {
  if (result.error) {
    throw new ExportRouteError(`Failed to load ${label}: ${result.error.message}`, 500)
  }

  return normalizeRows(result.data)
}

function optionalRows(result: QueryResult, label: string): ExportRecord[] {
  if (result.error) {
    if (isMissingRelationError(result.error)) {
      return []
    }

    throw new ExportRouteError(`Failed to load ${label}: ${result.error.message}`, 500)
  }

  return normalizeRows(result.data)
}

const defaultDeps: GetClientExportDeps = {
  requireSupervisor: async () => {
    const user = await requireSupervisor()
    return { id: user.id }
  },
  loadExportData: async (clientId: string): Promise<ClientExportData> => {
    const supabase = await createClient()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle()

    if (clientError) {
      throw new ExportRouteError(`Failed to load client: ${clientError.message}`, 500)
    }

    if (!client) {
      return {
        client: null,
        contacts: [],
        purchases: [],
        interests: [],
        sizing: [],
        meetings: [],
        visits: [],
      }
    }

    const [
      contactsResult,
      purchasesResult,
      interestsResult,
      sizingResult,
      meetingsResult,
      visitsResult,
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('contact_date', { ascending: false }),
      supabase
        .from('purchases')
        .select('*')
        .eq('client_id', clientId)
        .order('purchase_date', { ascending: false }),
      supabase
        .from('client_interests')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('client_sizing')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('meetings')
        .select('*')
        .eq('client_id', clientId)
        .order('start_time', { ascending: false }),
      supabase
        .from('visits')
        .select('*')
        .eq('client_id', clientId)
        .order('visit_date', { ascending: false }),
    ])

    return {
      client: client as ExportRecord,
      contacts: requiredRows(contactsResult as QueryResult, 'contacts'),
      purchases: requiredRows(purchasesResult as QueryResult, 'purchases'),
      interests: requiredRows(interestsResult as QueryResult, 'interests'),
      sizing: requiredRows(sizingResult as QueryResult, 'sizing'),
      meetings: optionalRows(meetingsResult as QueryResult, 'meetings'),
      visits: optionalRows(visitsResult as QueryResult, 'visits'),
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

// GET /api/clients/[id]/export - supervisor-only DSAR export
export const GET = createGetClientExportHandler(defaultDeps)
