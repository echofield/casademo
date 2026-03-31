import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { createPostPurchasesHandler } from './post-handler'

type ResolverArgs = {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  filters: Record<string, unknown>
  values?: unknown
  mode: 'many' | 'single' | 'maybeSingle'
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

  then<TResult1 = { data: unknown; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(
      this.resolver({
        table: this.table,
        operation: this.operation,
        filters: this.filters,
        values: this.values,
        mode: 'many',
      })
    ).then(onfulfilled, onrejected)
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
  return new NextRequest('http://localhost:3000/api/clients/client-1/purchases?nxtPid=test-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test('POST /api/clients/[id]/purchases accepts amount-only payload and defaults source to other', async () => {
  const todayKey = new Date().toISOString().split('T')[0]

  const handler = createPostPurchasesHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation, filters, values }) => {
        if (table === 'clients' && operation === 'select') {
          assert.equal(filters.id, 'client-1')
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'purchases' && operation === 'insert') {
          const payload = values as Record<string, unknown>
          assert.equal(payload.client_id, 'client-1')
          assert.equal(payload.seller_id, 'seller-1')
          assert.equal(payload.amount, 450)
          assert.equal(payload.source, 'other')
          assert.equal(payload.product_name, null)
          assert.equal(payload.product_category, null)
          assert.equal(payload.size, null)
          assert.equal(payload.size_type, null)
          assert.equal(payload.is_gift, false)
          assert.equal(payload.gift_recipient, null)
          assert.equal(payload.purchase_date, todayKey)

          return {
            data: {
              id: 'purchase-1',
              ...(values as Record<string, unknown>),
            },
            error: null,
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'seller-1' } as any),
  })

  const response = await handler(createRequest({ amount: 450 }), {
    params: Promise.resolve({ id: 'client-1' }),
  })

  assert.equal(response.status, 201)
  const payload = await response.json()
  assert.equal(payload.id, 'purchase-1')
  assert.equal(payload.source, 'other')
  assert.equal(payload.amount, 450)
})

test('POST /api/clients/[id]/purchases rejects invalid amount and returns clear validation failure', async () => {
  let insertAttempted = false

  const handler = createPostPurchasesHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation }) => {
        if (table === 'clients' && operation === 'select') {
          return { data: { id: 'client-1' }, error: null }
        }

        if (table === 'purchases' && operation === 'insert') {
          insertAttempted = true
        }

        return { data: null, error: null }
      }) as any,
    requireAuth: async () => ({ id: 'seller-1' } as any),
  })

  const response = await handler(createRequest({ amount: 0 }), {
    params: Promise.resolve({ id: 'client-1' }),
  })

  assert.equal(response.status, 400)
  assert.equal(insertAttempted, false)

  const payload = await response.json()
  assert.equal(payload.error, 'Validation failed')
  assert.deepEqual(payload.details.fieldErrors.amount, ['Amount must be positive'])
})

test('POST /api/clients/[id]/purchases returns 404 when client does not exist', async () => {
  const handler = createPostPurchasesHandler({
    createClient: async () =>
      createSupabaseMock(async ({ table, operation }) => {
        if (table === 'clients' && operation === 'select') {
          return {
            data: null,
            error: {
              code: 'PGRST116',
              message: 'No rows found',
            },
          }
        }

        throw new Error(`Unexpected query: ${table} ${operation}`)
      }) as any,
    requireAuth: async () => ({ id: 'seller-1' } as any),
  })

  const response = await handler(createRequest({ amount: 300 }), {
    params: Promise.resolve({ id: 'missing-client' }),
  })

  assert.equal(response.status, 404)
  const payload = await response.json()
  assert.equal(payload.error, 'Client not found')
})
