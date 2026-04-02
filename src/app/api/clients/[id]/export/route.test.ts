import test from 'node:test'
import assert from 'node:assert/strict'
import { createGetClientExportHandler, type ClientExportData } from './get-handler'

function buildExportData(): ClientExportData {
  return {
    client: { id: 'client-1', first_name: 'Aline', last_name: 'Demo' },
    contacts: [{ id: 'contact-1' }],
    purchases: [{ id: 'purchase-1' }],
    interests: [{ id: 'interest-1' }],
    sizing: [{ id: 'sizing-1' }],
    meetings: [{ id: 'meeting-1' }],
    visits: [{ id: 'visit-1' }],
  }
}

test('GET /api/clients/[id]/export allows supervisor and returns structured JSON', async () => {
  const auditEvents: Array<Record<string, unknown>> = []

  const handler = createGetClientExportHandler({
    requireSupervisor: async () => ({ id: 'supervisor-1' }),
    loadExportData: async () => buildExportData(),
    writeAuditEvent: async (event) => {
      auditEvents.push(event)
      return { error: null }
    },
    now: () => '2026-04-01T12:00:00.000Z',
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/client-1/export', { method: 'GET' }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 200)
  const payload = await response.json()

  assert.equal(payload.client.id, 'client-1')
  assert.equal(payload.contacts.length, 1)
  assert.equal(payload.purchases.length, 1)
  assert.equal(payload.interests.length, 1)
  assert.equal(payload.sizing.length, 1)
  assert.equal(payload.meetings.length, 1)
  assert.equal(payload.visits.length, 1)
  assert.equal(payload.exported_at, '2026-04-01T12:00:00.000Z')

  assert.equal(auditEvents.length, 1)
  assert.equal(auditEvents[0].action_type, 'export')
  assert.equal(auditEvents[0].actor_id, 'supervisor-1')
  assert.equal(auditEvents[0].client_id, 'client-1')
})

test('GET /api/clients/[id]/export rejects non-supervisor callers', async () => {
  const authError = Object.assign(new Error('Requires supervisor role'), { status: 403 })

  const handler = createGetClientExportHandler({
    requireSupervisor: async () => {
      throw authError
    },
    loadExportData: async () => buildExportData(),
    writeAuditEvent: async () => ({ error: null }),
    now: () => '2026-04-01T12:00:00.000Z',
    isAuthError: (err): err is { message: string; status: number } =>
      typeof err === 'object' && err !== null && 'status' in err,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/client-1/export', { method: 'GET' }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.error, 'Requires supervisor role')
})

test('GET /api/clients/[id]/export returns 404 when client is not found', async () => {
  const handler = createGetClientExportHandler({
    requireSupervisor: async () => ({ id: 'supervisor-1' }),
    loadExportData: async () => ({
      client: null,
      contacts: [],
      purchases: [],
      interests: [],
      sizing: [],
      meetings: [],
      visits: [],
    }),
    writeAuditEvent: async () => ({ error: null }),
    now: () => '2026-04-01T12:00:00.000Z',
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/missing/export', { method: 'GET' }),
    { params: Promise.resolve({ id: 'missing' }) }
  )

  assert.equal(response.status, 404)
  const payload = await response.json()
  assert.equal(payload.error, 'Client not found')
})
