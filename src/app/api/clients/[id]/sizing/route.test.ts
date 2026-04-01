import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { createPostSizingHandler } from './post-handler'

type ResolverArgs = {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  filters: Record<string, unknown>
  values?: unknown
  mode: 'maybeSingle' | 'single'
}

class FakeQueryBuilder {
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private filters: Record<string, unknown> = {}
  private values: unknown

  constructor(
    private readonly table: string,
    private readonly resolver: (args: ResolverArgs) => Promise<{ data: unknown; error: any }> | { data: unknown; error: any }
  ) {}

  select() {
    return this
  }

  insert(values: unknown) {
    this.operation = 'insert'
    this.values = values
    return this
  }

  update(values: unknown) {
    this.operation = 'update'
    this.values = values
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.filters[column] = value
    return this
  }

  maybeSingle() {
    return Promise.resolve(
      this.resolver({
        table: this.table,
        operation: this.operation,
        filters: this.filters,
        values: this.values,
        mode: 'maybeSingle',
      })
    )
  }

  single() {
    return Promise.resolve(
      this.resolver({
        table: this.table,
        operation: this.operation,
        filters: this.filters,
        values: this.values,
        mode: 'single',
      })
    )
  }
}

function createSupabaseMock(
  resolver: (args: ResolverArgs) => Promise<{ data: unknown; error: any }> | { data: unknown; error: any }
) {
  return {
    from(table: string) {
      return new FakeQueryBuilder(table, resolver)
    },
  }
}

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/clients/client-1/sizing?nxtPid=test-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const logger = {
  info() {},
  warn() {},
  error() {},
}

test('POST /api/clients/[id]/sizing saves a valid sizing payload', async () => {
  const handler = createPostSizingHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation, filters, values }) => {
        if (table === 'clients' && operation === 'select') {
          assert.equal(filters.id, 'client-1')
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'select') {
          assert.equal(filters.client_id, 'client-1')
          assert.equal(filters.category, 'shirts')
          return { data: null, error: null }
        }

        if (table === 'client_sizing' && operation === 'insert') {
          assert.deepEqual(values, {
            client_id: 'client-1',
            category: 'shirts',
            size: 'M',
            size_system: 'INTL',
            fit_preference: 'slim',
            notes: null,
          })

          return {
            data: {
              id: 'sizing-1',
              ...(values as Record<string, unknown>),
            },
            error: null,
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shirts',
    size: 'M',
    size_system: 'INTL',
    fit_preference: ' slim ',
    notes: '   ',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 201)
  const payload = await response.json()
  assert.equal(payload.id, 'sizing-1')
  assert.equal(payload.category, 'shirts')
  assert.equal(payload.fit_preference, 'slim')
  assert.equal(payload.notes, null)
})

test('POST /api/clients/[id]/sizing rejects an invalid sizing payload', async () => {
  let touchedSupabase = false

  const handler = createPostSizingHandler({
    createClient: async () => {
      touchedSupabase = true
      return createSupabaseMock(async () => ({ data: null, error: null })) as any
    },
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shirts',
    size: '44',
    size_system: 'INTL',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 400)
  assert.equal(touchedSupabase, true)
  const payload = await response.json()
  assert.equal(payload.error, 'Validation failed')
  assert.deepEqual(payload.details.fieldErrors.size, ['Invalid size "44" for category "shirts" in INTL'])
})

test('POST /api/clients/[id]/sizing maps Supabase write errors without masking them as generic 500s', async () => {
  const handler = createPostSizingHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation }) => {
        if (table === 'clients' && operation === 'select') {
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'select') {
          return { data: null, error: null }
        }

        if (table === 'client_sizing' && operation === 'insert') {
          return {
            data: null,
            error: {
              message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification',
              details: null,
              hint: null,
              code: '42P10',
            },
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shirts',
    size: 'M',
    size_system: 'INTL',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error, 'Invalid sizing payload')
})

test('POST /api/clients/[id]/sizing supports UK shoe sizing values', async () => {
  const handler = createPostSizingHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation, filters, values }) => {
        if (table === 'clients' && operation === 'select') {
          assert.equal(filters.id, 'client-1')
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'select') {
          assert.equal(filters.client_id, 'client-1')
          assert.equal(filters.category, 'shoes')
          return { data: null, error: null }
        }

        if (table === 'client_sizing' && operation === 'insert') {
          assert.deepEqual(values, {
            client_id: 'client-1',
            category: 'shoes',
            size: '10',
            size_system: 'UK',
            fit_preference: null,
            notes: null,
          })

          return {
            data: {
              id: 'sizing-uk-1',
              ...(values as Record<string, unknown>),
            },
            error: null,
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shoes',
    size: '10',
    size_system: 'UK',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 201)
  const payload = await response.json()
  assert.equal(payload.id, 'sizing-uk-1')
  assert.equal(payload.size_system, 'UK')
})

test('POST /api/clients/[id]/sizing retries insert with required fields when optional columns are missing in production schema', async () => {
  let insertAttempt = 0

  const handler = createPostSizingHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation, values }) => {
        if (table === 'clients' && operation === 'select') {
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'select') {
          return { data: null, error: null }
        }

        if (table === 'client_sizing' && operation === 'insert') {
          insertAttempt += 1

          if (insertAttempt === 1) {
            assert.deepEqual(values, {
              client_id: 'client-1',
              category: 'shirts',
              size: 'S',
              size_system: 'INTL',
              fit_preference: null,
              notes: null,
            })

            return {
              data: null,
              error: {
                code: 'PGRST204',
                message: "Could not find the 'notes' column of 'client_sizing' in the schema cache",
                details: null,
                hint: null,
              },
            }
          }

          assert.deepEqual(values, {
            client_id: 'client-1',
            category: 'shirts',
            size: 'S',
            size_system: 'INTL',
          })

          return {
            data: {
              id: 'sizing-fallback-insert',
              ...(values as Record<string, unknown>),
            },
            error: null,
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shirts',
    size: 'S',
    size_system: 'INTL',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 201)
  assert.equal(insertAttempt, 2)
  const payload = await response.json()
  assert.equal(payload.id, 'sizing-fallback-insert')
})

test('POST /api/clients/[id]/sizing retries update with required fields when optional columns are missing in production schema', async () => {
  let updateAttempt = 0

  const handler = createPostSizingHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation, values }) => {
        if (table === 'clients' && operation === 'select') {
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'select') {
          return { data: { id: 'sizing-existing' }, error: null }
        }

        if (table === 'client_sizing' && operation === 'update') {
          updateAttempt += 1

          if (updateAttempt === 1) {
            assert.deepEqual(values, {
              category: 'shirts',
              size: 'L',
              size_system: 'INTL',
              fit_preference: null,
              notes: null,
            })

            return {
              data: null,
              error: {
                code: 'PGRST204',
                message: "Could not find the 'fit_preference' column of 'client_sizing' in the schema cache",
                details: null,
                hint: null,
              },
            }
          }

          assert.deepEqual(values, {
            size: 'L',
            size_system: 'INTL',
          })

          return {
            data: {
              id: 'sizing-existing',
              category: 'shirts',
              size: 'L',
              size_system: 'INTL',
            },
            error: null,
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'user-1' } as any),
    logger,
  })

  const response = await handler(createRequest({
    category: 'shirts',
    size: 'L',
    size_system: 'INTL',
  }), { params: Promise.resolve({ id: 'client-1' }) })

  assert.equal(response.status, 200)
  assert.equal(updateAttempt, 2)
  const payload = await response.json()
  assert.equal(payload.id, 'sizing-existing')
  assert.equal(payload.size, 'L')
})
