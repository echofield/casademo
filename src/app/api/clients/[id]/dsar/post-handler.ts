import { NextResponse } from 'next/server'

export const DSAR_ANONYMIZED_FIRST_NAME = 'Anonymized'
export const DSAR_ANONYMIZED_LAST_NAME = 'Client'
export const DSAR_ANONYMIZED_NOTES = '[DSAR_ANONYMIZED]'

export const DSAR_ANONYMIZED_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'birthday',
  'notes',
] as const

export type DsarClientRecord = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  birthday: string | null
  notes: string | null
}

export type DsarAnonymizeUpdates = {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birthday: string | null
  notes: string
  updated_at: string
}

export type DsarAuditEvent = {
  action_type: 'anonymize'
  actor_id: string
  client_id: string
  action_at: string
  details: Record<string, unknown> | null
}

export type AuthErrorLike = {
  message: string
  status: number
}

export type PostClientDsarDeps = {
  requireSupervisor: () => Promise<{ id: string }>
  loadClient: (clientId: string) => Promise<DsarClientRecord | null>
  anonymizeClient: (clientId: string, updates: DsarAnonymizeUpdates) => Promise<{ error: { message: string } | null }>
  writeAuditEvent: (event: DsarAuditEvent) => Promise<{ error: { message: string } | null }>
  now: () => string
  isAuthError: (err: unknown) => err is AuthErrorLike
}

function isAlreadyAnonymized(client: DsarClientRecord) {
  return (
    client.first_name === DSAR_ANONYMIZED_FIRST_NAME &&
    client.last_name === DSAR_ANONYMIZED_LAST_NAME &&
    client.email === null &&
    client.phone === null &&
    client.birthday === null &&
    client.notes === DSAR_ANONYMIZED_NOTES
  )
}

function buildAnonymizedUpdates(actionAt: string): DsarAnonymizeUpdates {
  return {
    first_name: DSAR_ANONYMIZED_FIRST_NAME,
    last_name: DSAR_ANONYMIZED_LAST_NAME,
    email: null,
    phone: null,
    birthday: null,
    notes: DSAR_ANONYMIZED_NOTES,
    updated_at: actionAt,
  }
}

export function createPostClientDsarHandler(deps: PostClientDsarDeps) {
  return async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const supervisor = await deps.requireSupervisor()
      const { id: clientId } = await params
      const client = await deps.loadClient(clientId)

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const actionAt = deps.now()
      const alreadyAnonymized = isAlreadyAnonymized(client)

      if (!alreadyAnonymized) {
        const updates = buildAnonymizedUpdates(actionAt)
        const { error: anonymizeError } = await deps.anonymizeClient(clientId, updates)

        if (anonymizeError) {
          return NextResponse.json({ error: anonymizeError.message }, { status: 500 })
        }
      }

      const { error: auditError } = await deps.writeAuditEvent({
        action_type: 'anonymize',
        actor_id: supervisor.id,
        client_id: clientId,
        action_at: actionAt,
        details: {
          already_anonymized: alreadyAnonymized,
          anonymized_fields: [...DSAR_ANONYMIZED_FIELDS],
        },
      })

      if (auditError) {
        return NextResponse.json({ error: 'Failed to persist audit event' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        client_id: clientId,
        already_anonymized: alreadyAnonymized,
        anonymized_fields: [...DSAR_ANONYMIZED_FIELDS],
        anonymized_at: actionAt,
      })
    } catch (err) {
      if (deps.isAuthError(err)) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      const status =
        err instanceof Error && 'status' in err
          ? (err as Error & { status: number }).status
          : 500
      const message = err instanceof Error ? err.message : 'Failed to anonymize client'

      return NextResponse.json({ error: message }, { status })
    }
  }
}
