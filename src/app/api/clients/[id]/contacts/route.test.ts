import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { createPostContactsHandler, MARK_DONE_COMMENT } from './post-handler'

type ContactClientRow = {
  id: string
  first_name: string
  last_name: string
  seller_id: string
  tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
  seller_signal: 'very_hot' | 'hot' | 'warm' | 'cold' | 'lost' | null
  locale: 'local' | 'foreign' | null
  first_contact_date: string | null
  last_contact_date?: string | null
  next_recontact_date?: string | null
}

type ContactRow = {
  id: string
  client_id: string
  seller_id: string
  channel: string
  comment: string | null
  contact_date: string
}

type ProfileRow = {
  id: string
  role: 'seller' | 'supervisor'
  active: boolean
  full_name: string
}

type NotificationRow = {
  user_id: string
  type: string
  title: string
  message: string
  client_id: string
}

type MockState = {
  clients: Map<string, ContactClientRow>
  contacts: ContactRow[]
  queueBySeller: Map<string, Set<string>>
  profiles: ProfileRow[]
  notifications: NotificationRow[]
  nextContactId: number
}

type Operation = 'select' | 'insert' | 'update'
type Mode = 'many' | 'single' | 'maybeSingle'

type Filter = {
  type: 'eq' | 'gte' | 'lt'
  column: string
  value: unknown
}

class FakeQueryBuilder {
  private operation: Operation = 'select'
  private filters: Filter[] = []
  private values: any
  private selectOptions: { count?: 'exact'; head?: boolean } | undefined

  constructor(private readonly table: string, private readonly state: MockState) {}

  select(_columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    this.selectOptions = options
    return this
  }

  insert(values: any) {
    this.operation = 'insert'
    this.values = values
    return this
  }

  update(values: any) {
    this.operation = 'update'
    this.values = values
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  gte(column: string, value: unknown) {
    this.filters.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: unknown) {
    this.filters.push({ type: 'lt', column, value })
    return this
  }

  order() {
    return this
  }

  limit() {
    return this
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.execute('many')).then(onfulfilled, onrejected)
  }

  single() {
    return Promise.resolve(this.execute('single'))
  }

  maybeSingle() {
    return Promise.resolve(this.execute('maybeSingle'))
  }

  private execute(mode: Mode) {
    if (this.table === 'clients') {
      return this.executeClients(mode)
    }

    if (this.table === 'contacts') {
      return this.executeContacts(mode)
    }

    if (this.table === 'recontact_queue') {
      return this.executeRecontactQueue()
    }

    if (this.table === 'profiles') {
      return this.executeProfiles(mode)
    }

    if (this.table === 'notifications') {
      return this.executeNotifications(mode)
    }

    throw new Error(`Unexpected table in mock: ${this.table}`)
  }

  private executeClients(mode: Mode) {
    const rows = this.applyFilters(Array.from(this.state.clients.values()))

    if (this.operation === 'update') {
      for (const row of rows) {
        const updated = {
          ...row,
          ...(this.values as Record<string, unknown>),
        }
        this.state.clients.set(row.id, updated as ContactClientRow)
      }
      const updatedRows = this.applyFilters(Array.from(this.state.clients.values()))
      const first = updatedRows[0] ?? null
      return { data: first, error: first ? null : { code: 'PGRST116', message: 'No rows found' } }
    }

    const first = rows[0] ?? null
    if (mode === 'single') {
      return { data: first, error: first ? null : { code: 'PGRST116', message: 'No rows found' } }
    }

    if (mode === 'maybeSingle') {
      return { data: first, error: null }
    }

    return { data: rows, error: null }
  }

  private executeContacts(mode: Mode) {
    if (this.operation === 'insert') {
      const row: ContactRow = {
        id: `contact-${this.state.nextContactId++}`,
        ...this.values,
      }
      this.state.contacts.push(row)

      if (row.channel === 'other' && row.comment === MARK_DONE_COMMENT) {
        const queue = this.state.queueBySeller.get(row.seller_id)
        queue?.delete(row.client_id)
      }

      if (mode === 'single' || mode === 'maybeSingle') {
        return { data: row, error: null }
      }
      return { data: [row], error: null }
    }

    const rows = this.applyFilters(this.state.contacts)
    const first = rows[0] ?? null

    if (mode === 'single') {
      return { data: first, error: first ? null : { code: 'PGRST116', message: 'No rows found' } }
    }

    if (mode === 'maybeSingle') {
      return { data: first, error: null }
    }

    return { data: rows, error: null }
  }

  private executeRecontactQueue() {
    const sellerFilter = this.filters.find((filter) => filter.type === 'eq' && filter.column === 'seller_id')
    const sellerId = sellerFilter?.value as string | undefined
    const queueCount = sellerId ? (this.state.queueBySeller.get(sellerId)?.size ?? 0) : 0

    if (this.selectOptions?.head) {
      return { data: null, error: null, count: queueCount }
    }

    return { data: [], error: null, count: queueCount }
  }

  private executeProfiles(mode: Mode) {
    const rows = this.applyFilters(this.state.profiles)
    if (mode === 'single') {
      const first = rows[0] ?? null
      return { data: first, error: first ? null : { code: 'PGRST116', message: 'No rows found' } }
    }

    if (mode === 'maybeSingle') {
      return { data: rows[0] ?? null, error: null }
    }

    return { data: rows, error: null }
  }

  private executeNotifications(mode: Mode) {
    if (this.operation !== 'insert') {
      throw new Error('Notifications mock only supports insert in this test')
    }

    const rows = Array.isArray(this.values) ? this.values : [this.values]
    this.state.notifications.push(...rows)

    if (mode === 'single') {
      return { data: rows[0] ?? null, error: null }
    }

    if (mode === 'maybeSingle') {
      return { data: rows[0] ?? null, error: null }
    }

    return { data: rows, error: null }
  }

  private applyFilters<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.filter((row) => {
      return this.filters.every((filter) => {
        const value = row[filter.column]

        if (filter.type === 'eq') {
          return value === filter.value
        }

        if (filter.type === 'gte') {
          const left = new Date(value).getTime()
          const right = new Date(String(filter.value)).getTime()
          return left >= right
        }

        if (filter.type === 'lt') {
          const left = new Date(value).getTime()
          const right = new Date(String(filter.value)).getTime()
          return left < right
        }

        return true
      })
    })
  }
}

function createSupabaseMock(state: MockState) {
  return {
    from(table: string) {
      return new FakeQueryBuilder(table, state)
    },
    async rpc(fn: string) {
      if (fn === 'get_recontact_days') {
        return { data: 30, error: null }
      }

      throw new Error(`Unexpected RPC: ${fn}`)
    },
  }
}

function createRequest(clientId: string, body: unknown) {
  return new NextRequest(`http://localhost:3000/api/clients/${clientId}/contacts?nxtPid=test-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createInitialState(): MockState {
  return {
    clients: new Map<string, ContactClientRow>([
      ['client-1', {
        id: 'client-1',
        first_name: 'Alice',
        last_name: 'Queue',
        seller_id: 'seller-1',
        tier: 'optimisto',
        seller_signal: 'warm',
        locale: 'local',
        first_contact_date: null,
        last_contact_date: null,
        next_recontact_date: '2026-03-30',
      }],
      ['client-2', {
        id: 'client-2',
        first_name: 'Bruno',
        last_name: 'Queue',
        seller_id: 'seller-1',
        tier: 'optimisto',
        seller_signal: 'warm',
        locale: 'local',
        first_contact_date: null,
        last_contact_date: null,
        next_recontact_date: '2026-03-30',
      }],
    ]),
    contacts: [],
    queueBySeller: new Map([['seller-1', new Set(['client-1', 'client-2'])]]),
    profiles: [
      { id: 'seller-1', role: 'seller', active: true, full_name: 'Seller One' },
      { id: 'supervisor-1', role: 'supervisor', active: true, full_name: 'Supervisor One' },
    ],
    notifications: [],
    nextContactId: 1,
  }
}

test('POST /api/clients/[id]/contacts mark-done decrements queue from backend truth and is idempotent same day', async () => {
  const state = createInitialState()
  const supabase = createSupabaseMock(state)

  const handler = createPostContactsHandler({
    createClient: async () => supabase as any,
    requireAuth: async () => ({
      id: 'seller-1',
      profile: { full_name: 'Seller One' },
    } as any),
    logger: { warn() {} },
  })

  const firstResponse = await handler(
    createRequest('client-1', { channel: 'other', comment: MARK_DONE_COMMENT }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(firstResponse.status, 201)
  const firstPayload = await firstResponse.json()
  assert.equal(firstPayload.seller_remaining_count, 1)
  assert.equal(firstPayload.already_done, undefined)
  assert.equal(state.queueBySeller.get('seller-1')?.has('client-1'), false)
  assert.equal(state.contacts.length, 1)

  const secondResponse = await handler(
    createRequest('client-1', { channel: 'other', comment: MARK_DONE_COMMENT }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(secondResponse.status, 200)
  const secondPayload = await secondResponse.json()
  assert.equal(secondPayload.already_done, true)
  assert.equal(secondPayload.seller_remaining_count, 1)
  assert.equal(state.contacts.length, 1)

  const thirdResponse = await handler(
    createRequest('client-2', { channel: 'other', comment: MARK_DONE_COMMENT }),
    { params: Promise.resolve({ id: 'client-2' }) }
  )

  assert.equal(thirdResponse.status, 201)
  const thirdPayload = await thirdResponse.json()
  assert.equal(thirdPayload.seller_remaining_count, 0)
  assert.equal(state.queueBySeller.get('seller-1')?.size, 0)
  assert.equal(state.contacts.length, 2)
})

test('POST /api/clients/[id]/contacts updates last_contact_date and next_recontact_date from completed contact', async () => {
  const state = createInitialState()
  const supabase = createSupabaseMock(state)

  const handler = createPostContactsHandler({
    createClient: async () => supabase as any,
    requireAuth: async () => ({
      id: 'seller-1',
      profile: { full_name: 'Seller One' },
    } as any),
    logger: { warn() {} },
  })

  const response = await handler(
    createRequest('client-1', { channel: 'other', comment: MARK_DONE_COMMENT }),
    { params: Promise.resolve({ id: 'client-1' }) }
  )

  assert.equal(response.status, 201)
  const payload = await response.json()

  const updatedClient = state.clients.get('client-1')
  assert.ok(updatedClient)

  const expectedLastContact = new Date().toISOString().slice(0, 10)
  assert.equal(updatedClient?.last_contact_date, expectedLastContact)

  const expectedNext = new Date(`${expectedLastContact}T00:00:00.000Z`)
  expectedNext.setUTCDate(expectedNext.getUTCDate() + 30)
  assert.equal(updatedClient?.next_recontact_date, expectedNext.toISOString().slice(0, 10))

  assert.equal(payload.client.last_contact_date, expectedLastContact)
  assert.equal(payload.client.next_recontact_date, expectedNext.toISOString().slice(0, 10))
})
