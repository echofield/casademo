import test from 'node:test'
import assert from 'node:assert/strict'
import { createPostNotificationsGenerateHandler } from './post-handler'

type RpcResult = {
  data: number | null
  error: { message: string } | null
}

function createRpcClient(results: Record<string, RpcResult>, calls: string[]) {
  return {
    async rpc(fn: string): Promise<RpcResult> {
      calls.push(fn)
      return results[fn] ?? { data: 0, error: null }
    },
  }
}

test('POST /api/notifications/generate manual path requires supervisor and uses user session client', async () => {
  let requireSupervisorCalls = 0
  let createUserClientCalls = 0
  let createServiceClientCalls = 0
  const rpcCalls: string[] = []

  const userClient = createRpcClient(
    {
      generate_overdue_notifications: { data: 3, error: null },
      generate_seller_inactivity_alerts: { data: 1, error: null },
      generate_birthday_follow_up_notifications: { data: 2, error: null },
    },
    rpcCalls
  )

  const handler = createPostNotificationsGenerateHandler({
    createUserClient: async () => {
      createUserClientCalls += 1
      return userClient
    },
    createServiceClient: () => {
      createServiceClientCalls += 1
      return userClient
    },
    requireSupervisor: async () => {
      requireSupervisorCalls += 1
    },
    getCronSecret: () => 'cron-secret',
    getServiceRoleKey: () => 'service-key',
    logger: { error() {} },
  })

  const response = await handler(new Request('http://localhost/api/notifications/generate', { method: 'POST' }))
  assert.equal(response.status, 200)

  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.overdue_notifications, 3)
  assert.equal(payload.inactivity_alerts, 1)
  assert.equal(payload.birthday_follow_ups, 2)

  assert.equal(requireSupervisorCalls, 1)
  assert.equal(createUserClientCalls, 1)
  assert.equal(createServiceClientCalls, 0)
  assert.deepEqual(rpcCalls, [
    'generate_overdue_notifications',
    'generate_seller_inactivity_alerts',
    'generate_birthday_follow_up_notifications',
  ])
})

test('POST /api/notifications/generate cron-secret path uses service-role client and skips supervisor auth', async () => {
  let requireSupervisorCalls = 0
  let createUserClientCalls = 0
  let createServiceClientCalls = 0
  const rpcCalls: string[] = []

  const serviceClient = createRpcClient(
    {
      generate_overdue_notifications: { data: 5, error: null },
      generate_seller_inactivity_alerts: { data: 0, error: null },
      generate_birthday_follow_up_notifications: { data: 4, error: null },
    },
    rpcCalls
  )

  const handler = createPostNotificationsGenerateHandler({
    createUserClient: async () => {
      createUserClientCalls += 1
      return serviceClient
    },
    createServiceClient: () => {
      createServiceClientCalls += 1
      return serviceClient
    },
    requireSupervisor: async () => {
      requireSupervisorCalls += 1
      throw new Error('requireSupervisor should not be called for cron-secret requests')
    },
    getCronSecret: () => 'cron-secret',
    getServiceRoleKey: () => 'service-key',
    logger: { error() {} },
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/generate', {
      method: 'POST',
      headers: { authorization: 'Bearer cron-secret' },
    })
  )

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.success, true)
  assert.equal(payload.overdue_notifications, 5)
  assert.equal(payload.inactivity_alerts, 0)
  assert.equal(payload.birthday_follow_ups, 4)

  assert.equal(requireSupervisorCalls, 0)
  assert.equal(createUserClientCalls, 0)
  assert.equal(createServiceClientCalls, 1)
  assert.deepEqual(rpcCalls, [
    'generate_overdue_notifications',
    'generate_seller_inactivity_alerts',
    'generate_birthday_follow_up_notifications',
  ])
})

test('POST /api/notifications/generate cron-secret path fails closed when service key is missing', async () => {
  let createServiceClientCalls = 0
  let loggedErrors = 0

  const handler = createPostNotificationsGenerateHandler({
    createUserClient: async () => createRpcClient({}, []),
    createServiceClient: () => {
      createServiceClientCalls += 1
      return createRpcClient({}, [])
    },
    requireSupervisor: async () => {
      throw new Error('requireSupervisor should not run when cron-secret matches')
    },
    getCronSecret: () => 'cron-secret',
    getServiceRoleKey: () => undefined,
    logger: {
      error() {
        loggedErrors += 1
      },
    },
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/generate', {
      method: 'POST',
      headers: { authorization: 'Bearer cron-secret' },
    })
  )

  assert.equal(response.status, 500)
  const payload = await response.json()
  assert.equal(payload.error, 'Server misconfiguration')
  assert.equal(createServiceClientCalls, 0)
  assert.equal(loggedErrors, 1)
})

test('POST /api/notifications/generate invalid cron header falls back to supervisor auth', async () => {
  const authError = Object.assign(new Error('Requires supervisor role'), { status: 403 })

  const handler = createPostNotificationsGenerateHandler({
    createUserClient: async () => createRpcClient({}, []),
    createServiceClient: () => createRpcClient({}, []),
    requireSupervisor: async () => {
      throw authError
    },
    getCronSecret: () => 'cron-secret',
    getServiceRoleKey: () => 'service-key',
    logger: { error() {} },
  })

  const response = await handler(
    new Request('http://localhost/api/notifications/generate', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })
  )

  assert.equal(response.status, 403)
  const payload = await response.json()
  assert.equal(payload.error, 'Requires supervisor role')
})

test('POST /api/notifications/generate reports partial RPC failures without throwing', async () => {
  const rpcCalls: string[] = []

  const userClient = createRpcClient(
    {
      generate_overdue_notifications: { data: 2, error: null },
      generate_seller_inactivity_alerts: { data: null, error: { message: 'Insufficient privileges to generate notifications' } },
      generate_birthday_follow_up_notifications: { data: 1, error: null },
    },
    rpcCalls
  )

  const handler = createPostNotificationsGenerateHandler({
    createUserClient: async () => userClient,
    createServiceClient: () => userClient,
    requireSupervisor: async () => {},
    getCronSecret: () => undefined,
    getServiceRoleKey: () => 'service-key',
    logger: { error() {} },
  })

  const response = await handler(new Request('http://localhost/api/notifications/generate', { method: 'POST' }))
  assert.equal(response.status, 200)

  const payload = await response.json()
  assert.equal(payload.success, false)
  assert.equal(payload.overdue_notifications, 2)
  assert.equal(payload.inactivity_alerts, 0)
  assert.equal(payload.birthday_follow_ups, 1)
  assert.deepEqual(payload.errors, ['inactivity: Insufficient privileges to generate notifications'])
  assert.deepEqual(rpcCalls, [
    'generate_overdue_notifications',
    'generate_seller_inactivity_alerts',
    'generate_birthday_follow_up_notifications',
  ])
})
