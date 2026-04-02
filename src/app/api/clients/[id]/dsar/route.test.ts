import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createPostClientDsarHandler,
  DSAR_ANONYMIZED_FIELDS,
  DSAR_ANONYMIZED_FIRST_NAME,
  DSAR_ANONYMIZED_LAST_NAME,
  DSAR_ANONYMIZED_NOTES,
  type DsarAnonymizeUpdates,
} from './post-handler'

test('POST /api/clients/[id]/dsar allows supervisor and anonymizes personal fields', async () => {
  let appliedUpdates: DsarAnonymizeUpdates | null = null
  const auditEvents: Array<Record<string, unknown>> = []

  const handler = createPostClientDsarHandler({
    requireSupervisor: async () => ({ id: 'supervisor-1' }),
    loadClient: async () => ({
      id: 'client-1',
      first_name: 'Aline',
      last_name: 'Demo',
      email: 'aline@example.com',
      phone: '+33600000001',
      birthday: '1990-01-01',
      notes: 'VIP prefers private appointments',
    }),
    anonymizeClient: async (_clientId, updates) => {
      appliedUpdates = updates
      return { error: null }
    },
    writeAuditEvent: async (event) => {
      auditEvents.push(event)
      return { error: null }
    },
    now: () => '2026-04-01T13:00:00.000Z',
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/client-1/dsar', { method: 'POST' }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 200)
  const payload = await response.json()

  assert.equal(payload.success, true)
  assert.equal(payload.client_id, 'client-1')
  assert.equal(payload.already_anonymized, false)
  assert.deepEqual(payload.anonymized_fields, [...DSAR_ANONYMIZED_FIELDS])

  assert.deepEqual(appliedUpdates, {
    first_name: DSAR_ANONYMIZED_FIRST_NAME,
    last_name: DSAR_ANONYMIZED_LAST_NAME,
    email: null,
    phone: null,
    birthday: null,
    notes: DSAR_ANONYMIZED_NOTES,
    updated_at: '2026-04-01T13:00:00.000Z',
  })

  assert.equal(auditEvents.length, 1)
  assert.equal(auditEvents[0].action_type, 'anonymize')
  assert.equal(auditEvents[0].actor_id, 'supervisor-1')
})

test('POST /api/clients/[id]/dsar is idempotent when client is already anonymized', async () => {
  let anonymizeCalls = 0

  const handler = createPostClientDsarHandler({
    requireSupervisor: async () => ({ id: 'supervisor-1' }),
    loadClient: async () => ({
      id: 'client-1',
      first_name: DSAR_ANONYMIZED_FIRST_NAME,
      last_name: DSAR_ANONYMIZED_LAST_NAME,
      email: null,
      phone: null,
      birthday: null,
      notes: DSAR_ANONYMIZED_NOTES,
    }),
    anonymizeClient: async () => {
      anonymizeCalls += 1
      return { error: null }
    },
    writeAuditEvent: async () => ({ error: null }),
    now: () => '2026-04-01T13:10:00.000Z',
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/client-1/dsar', { method: 'POST' }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.already_anonymized, true)
  assert.equal(anonymizeCalls, 0)
})

test('POST /api/clients/[id]/dsar rejects non-supervisor callers', async () => {
  const authError = Object.assign(new Error('Requires supervisor role'), { status: 403 })

  const handler = createPostClientDsarHandler({
    requireSupervisor: async () => {
      throw authError
    },
    loadClient: async () => null,
    anonymizeClient: async () => ({ error: null }),
    writeAuditEvent: async () => ({ error: null }),
    now: () => '2026-04-01T13:00:00.000Z',
    isAuthError: (err): err is { message: string; status: number } =>
      typeof err === 'object' && err !== null && 'status' in err,
  })

  const response = await handler(
    new Request('http://localhost/api/clients/client-1/dsar', { method: 'POST' }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.error, 'Requires supervisor role')
})
