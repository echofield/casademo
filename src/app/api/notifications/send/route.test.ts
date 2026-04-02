import test from 'node:test'
import assert from 'node:assert/strict'
import { createPostNotificationsSendHandler } from './post-handler'

test('POST /api/notifications/send allows supervisor and calls send_notification RPC', async () => {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = []

  const handler = createPostNotificationsSendHandler({
    requireAuth: async () => ({ effectiveRole: 'supervisor' }),
    createClient: async () => ({
      rpc: async (fn, args) => {
        rpcCalls.push({ fn, args: args as Record<string, unknown> })
        return { data: 'notif-1', error: null }
      },
    }),
    logger: { error() {} },
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller_id: 'seller-1',
        client_id: 'client-1',
        client_name: 'Alice Queue',
        message: 'Supervisor reminder: Please check in with this client.',
      }),
    })
  )

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.notification_id, 'notif-1')

  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].fn, 'send_notification')
  assert.deepEqual(rpcCalls[0].args, {
    p_user_id: 'seller-1',
    p_type: 'manual',
    p_title: 'Reminder: Alice Queue',
    p_message: 'Supervisor reminder: Please check in with this client.',
    p_client_id: 'client-1',
  })
})

test('POST /api/notifications/send rejects non-supervisor callers', async () => {
  let rpcCalled = false

  const handler = createPostNotificationsSendHandler({
    requireAuth: async () => ({ effectiveRole: 'seller' }),
    createClient: async () => ({
      rpc: async () => {
        rpcCalled = true
        return { data: null, error: null }
      },
    }),
    logger: { error() {} },
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: 'seller-1' }),
    })
  )

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.error, 'Forbidden')
  assert.equal(rpcCalled, false)
})

test('POST /api/notifications/send returns 400 when seller_id is missing', async () => {
  let rpcCalled = false

  const handler = createPostNotificationsSendHandler({
    requireAuth: async () => ({ effectiveRole: 'supervisor' }),
    createClient: async () => ({
      rpc: async () => {
        rpcCalled = true
        return { data: null, error: null }
      },
    }),
    logger: { error() {} },
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'No Seller' }),
    })
  )

  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error, 'seller_id required')
  assert.equal(rpcCalled, false)
})

test('POST /api/notifications/send surfaces RPC failures', async () => {
  let logged = 0

  const handler = createPostNotificationsSendHandler({
    requireAuth: async () => ({ effectiveRole: 'supervisor' }),
    createClient: async () => ({
      rpc: async () => ({
        data: null,
        error: { message: 'Only supervisors can send notifications to other users' },
      }),
    }),
    logger: {
      error() {
        logged += 1
      },
    },
    isAuthError: (_err): _err is { message: string; status: number } => false,
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: 'seller-1' }),
    })
  )

  assert.equal(response.status, 500)
  const payload = await response.json()
  assert.equal(payload.error, 'Only supervisors can send notifications to other users')
  assert.equal(logged, 1)
})

test('POST /api/notifications/send maps auth errors to status/message', async () => {
  const authError = Object.assign(new Error('Account is deactivated'), { status: 403 })

  const handler = createPostNotificationsSendHandler({
    requireAuth: async () => {
      throw authError
    },
    createClient: async () => ({
      rpc: async () => ({ data: null, error: null }),
    }),
    logger: { error() {} },
    isAuthError: (err): err is { message: string; status: number } =>
      typeof err === 'object' && err !== null && 'status' in err,
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: 'seller-1' }),
    })
  )

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.error, 'Account is deactivated')
})
