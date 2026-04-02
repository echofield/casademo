import { NextResponse } from 'next/server'

export type ExportRecord = Record<string, unknown>

export type ClientExportData = {
  client: ExportRecord | null
  contacts: ExportRecord[]
  purchases: ExportRecord[]
  interests: ExportRecord[]
  sizing: ExportRecord[]
  meetings: ExportRecord[]
  visits: ExportRecord[]
}

export type DsarAuditEvent = {
  action_type: 'export'
  actor_id: string
  client_id: string
  action_at: string
  details: Record<string, unknown> | null
}

export type AuthErrorLike = {
  message: string
  status: number
}

export type GetClientExportDeps = {
  requireSupervisor: () => Promise<{ id: string }>
  loadExportData: (clientId: string) => Promise<ClientExportData>
  writeAuditEvent: (event: DsarAuditEvent) => Promise<{ error: { message: string } | null }>
  now: () => string
  isAuthError: (err: unknown) => err is AuthErrorLike
}

function getCollectionCounts(data: ClientExportData): Record<string, number> {
  return {
    contacts: data.contacts.length,
    purchases: data.purchases.length,
    interests: data.interests.length,
    sizing: data.sizing.length,
    meetings: data.meetings.length,
    visits: data.visits.length,
  }
}

export function createGetClientExportHandler(deps: GetClientExportDeps) {
  return async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const supervisor = await deps.requireSupervisor()
      const { id: clientId } = await params
      const exportData = await deps.loadExportData(clientId)

      if (!exportData.client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const actionAt = deps.now()
      const collectionCounts = getCollectionCounts(exportData)

      const { error: auditError } = await deps.writeAuditEvent({
        action_type: 'export',
        actor_id: supervisor.id,
        client_id: clientId,
        action_at: actionAt,
        details: {
          collection_counts: collectionCounts,
        },
      })

      if (auditError) {
        return NextResponse.json({ error: 'Failed to persist audit event' }, { status: 500 })
      }

      return NextResponse.json({
        client: exportData.client,
        contacts: exportData.contacts,
        purchases: exportData.purchases,
        interests: exportData.interests,
        sizing: exportData.sizing,
        meetings: exportData.meetings,
        visits: exportData.visits,
        exported_at: actionAt,
      })
    } catch (err) {
      if (deps.isAuthError(err)) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      const status =
        err instanceof Error && 'status' in err
          ? (err as Error & { status: number }).status
          : 500
      const message = err instanceof Error ? err.message : 'Failed to export client data'

      return NextResponse.json({ error: message }, { status })
    }
  }
}
