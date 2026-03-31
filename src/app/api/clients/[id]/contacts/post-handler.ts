import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import type { ContactChannel, ClientSignal, ClientTier } from '@/lib/types'

const VALID_CHANNELS: ContactChannel[] = ['whatsapp', 'sms', 'phone', 'email', 'in_store', 'other']
export const MARK_DONE_COMMENT = 'Follow-up completed'

const createContactSchema = z.object({
  channel: z.enum(VALID_CHANNELS as [ContactChannel, ...ContactChannel[]]),
  comment: z.string().optional().nullable(),
  contact_date: z.string().datetime().optional(),
})

type ContactClient = {
  id: string
  first_name: string
  last_name: string
  seller_id: string
  tier: ClientTier
  seller_signal: ClientSignal | null
  locale: 'local' | 'foreign' | null
  first_contact_date: string | null
}

const TIER_BASE_DAYS: Record<ClientTier, number> = {
  grand_prix: 7,
  diplomatico: 14,
  idealiste: 21,
  kaizen: 30,
  optimisto: 45,
  rainbow: 60,
}

function fallbackRecontactDays(tier: ClientTier, signal: ClientSignal | null): number {
  const baseDays = TIER_BASE_DAYS[tier] ?? 60
  const multiplier = signal === 'very_hot'
    ? 0.5
    : signal === 'cold'
      ? 1.5
      : signal === 'lost'
        ? 3
        : 1

  return Math.max(3, Math.round(baseDays * multiplier))
}

function toIsoDateKey(inputIso: string): string {
  const date = new Date(inputIso)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

function addDaysToIsoDate(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

type Logger = Pick<Console, 'warn'>

type PostContactsDeps = {
  createClient: typeof createClient
  requireAuth: typeof requireAuth
  logger: Logger
}

export function createPostContactsHandler(
  deps: PostContactsDeps = { createClient, requireAuth, logger: console }
) {
  // POST /api/clients/[id]/contacts - Log interaction
  return async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await deps.requireAuth()
      const supabase = await deps.createClient()
      const { id: client_id } = await params

      // Verify client exists and is accessible
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, seller_id, tier, seller_signal, locale, first_contact_date')
        .eq('id', client_id)
        .single<ContactClient>()

      if (clientError || !client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const body = await request.json()
      const parsed = createContactSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const isMarkDone =
        parsed.data.channel === 'other' &&
        (parsed.data.comment || '').trim().toLowerCase() === MARK_DONE_COMMENT.toLowerCase()

      const normalizedComment = isMarkDone
        ? MARK_DONE_COMMENT
        : (parsed.data.comment || '').trim() || null

      const getSellerRemainingCount = async () => {
        const { count } = await supabase
          .from('recontact_queue')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', client.seller_id)

        return count || 0
      }

      const resolveRecontactDays = async () => {
        const { data: dbDays, error: daysError } = await supabase.rpc('get_recontact_days', {
          p_tier: client.tier,
          p_signal: client.seller_signal,
          p_is_foreign: client.locale === 'foreign',
        })

        if (!daysError && typeof dbDays === 'number' && Number.isFinite(dbDays)) {
          return Math.max(3, Math.round(dbDays))
        }

        return fallbackRecontactDays(client.tier, client.seller_signal)
      }

      const reconcileClientDates = async (contactDateIso: string | null | undefined) => {
        const contactDateKey = toIsoDateKey(contactDateIso || new Date().toISOString())
        const recontactDays = await resolveRecontactDays()
        const nextRecontactKey = addDaysToIsoDate(contactDateKey, recontactDays)

        const updates: Record<string, string> = {
          last_contact_date: contactDateKey,
          next_recontact_date: nextRecontactKey,
        }

        if (!client.first_contact_date) {
          updates.first_contact_date = contactDateKey
        }

        const { data: reconciledClient } = await supabase
          .from('clients')
          .update(updates as any)
          .eq('id', client_id)
          .select('id, last_contact_date, next_recontact_date')
          .single()

        if (reconciledClient) {
          return reconciledClient
        }

        const { data: fallbackClient } = await supabase
          .from('clients')
          .select('id, last_contact_date, next_recontact_date')
          .eq('id', client_id)
          .single()

        return fallbackClient
      }

      // Idempotency for "Mark as done": one completion log per seller/client/day.
      if (isMarkDone) {
        const now = new Date()
        const startOfDayUtc = new Date(now)
        startOfDayUtc.setUTCHours(0, 0, 0, 0)
        const endOfDayUtc = new Date(startOfDayUtc)
        endOfDayUtc.setUTCDate(endOfDayUtc.getUTCDate() + 1)

        const { data: existingDone } = await supabase
          .from('contacts')
          .select('id, contact_date')
          .eq('client_id', client_id)
          .eq('seller_id', user.id)
          .eq('channel', 'other')
          .eq('comment', MARK_DONE_COMMENT)
          .gte('contact_date', startOfDayUtc.toISOString())
          .lt('contact_date', endOfDayUtc.toISOString())
          .order('contact_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingDone) {
          // Repair/confirm client dates from the persisted completion row to avoid ghost queue entries.
          const updatedClient = await reconcileClientDates(existingDone.contact_date)
          const seller_remaining_count = await getSellerRemainingCount()

          return NextResponse.json(
            {
              already_done: true,
              client: updatedClient,
              seller_id: client.seller_id,
              seller_remaining_count,
            },
            { status: 200 }
          )
        }
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          client_id,
          seller_id: user.id,
          channel: parsed.data.channel as string,
          comment: normalizedComment,
          contact_date: parsed.data.contact_date || new Date().toISOString(),
        } as any)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Notify supervisors that a seller contacted a client (operational visibility)
      const { data: supervisors } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'supervisor')
        .eq('active', true)

      const supervisorRows = (supervisors || []).filter((s) => s.id !== user.id)
      if (supervisorRows.length > 0) {
        const channelLabel = parsed.data.channel.replace('_', ' ')
        const tierLabel = String(client.tier || '').replace('_', ' ').toUpperCase()
        const notificationRows = supervisorRows.map((s) => ({
          user_id: s.id,
          type: 'manual' as const,
          title: `${user.profile.full_name} contacted ${client.first_name} ${client.last_name}`,
          message: `${channelLabel} - ${tierLabel}`,
          client_id,
        }))

        const { error: notifError } = await supabase.from('notifications').insert(notificationRows)
        if (notifError) {
          // Log but don't fail - contact was already saved successfully
          deps.logger.warn('[Contacts] Supervisor notification insert failed:', {
            client_id,
            seller_id: user.id,
            supervisor_count: supervisorRows.length,
            error: notifError.message,
          })
        }
      }

      const updatedClient = await reconcileClientDates(data?.contact_date)
      const seller_remaining_count = await getSellerRemainingCount()

      return NextResponse.json(
        {
          contact: data,
          client: updatedClient,
          seller_id: client.seller_id,
          seller_remaining_count,
        },
        { status: 201 }
      )
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }
  }
}
