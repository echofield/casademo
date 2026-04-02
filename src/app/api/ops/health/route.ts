import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'

/**
 * GET /api/ops/health - Operator health endpoint
 *
 * Returns system health status and recent activity for operator visibility.
 * Requires supervisor access.
 */
export async function GET() {
  const startTime = Date.now()

  try {
    await requireSupervisor()
    const supabase = await createClient()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Run checks in parallel with individual error tracking
    const checks: Record<string, { status: 'ok' | 'error'; value?: number | string; error?: string }> = {}

    const [
      contactsResult,
      purchasesResult,
      notificationsResult,
      overdueResult,
      profilesResult,
    ] = await Promise.allSettled([
      // Contacts in last hour
      supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('contact_date', oneHourAgo),

      // Purchases in last 24h
      supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .gte('purchase_date', oneDayAgo),

      // Unread notifications
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false),

      // Overdue contacts
      supabase
        .from('recontact_queue')
        .select('*', { count: 'exact', head: true })
        .gt('days_overdue', 0),

      // Active users (db connectivity check)
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),
    ])

    // Process contacts result
    if (contactsResult.status === 'fulfilled') {
      const { count, error } = contactsResult.value
      if (error) {
        checks.contacts_1h = { status: 'error', error: error.message }
      } else {
        checks.contacts_1h = { status: 'ok', value: count ?? 0 }
      }
    } else {
      checks.contacts_1h = { status: 'error', error: 'Query failed' }
    }

    // Process purchases result
    if (purchasesResult.status === 'fulfilled') {
      const { count, error } = purchasesResult.value
      if (error) {
        checks.purchases_24h = { status: 'error', error: error.message }
      } else {
        checks.purchases_24h = { status: 'ok', value: count ?? 0 }
      }
    } else {
      checks.purchases_24h = { status: 'error', error: 'Query failed' }
    }

    // Process notifications result
    if (notificationsResult.status === 'fulfilled') {
      const { count, error } = notificationsResult.value
      if (error) {
        checks.unread_notifications = { status: 'error', error: error.message }
      } else {
        checks.unread_notifications = { status: 'ok', value: count ?? 0 }
      }
    } else {
      checks.unread_notifications = { status: 'error', error: 'Query failed' }
    }

    // Process overdue result
    if (overdueResult.status === 'fulfilled') {
      const { count, error } = overdueResult.value
      if (error) {
        checks.overdue_contacts = { status: 'error', error: error.message }
      } else {
        checks.overdue_contacts = { status: 'ok', value: count ?? 0 }
      }
    } else {
      checks.overdue_contacts = { status: 'error', error: 'Query failed' }
    }

    // Process profiles result (db connectivity)
    if (profilesResult.status === 'fulfilled') {
      const { count, error } = profilesResult.value
      if (error) {
        checks.db_connection = { status: 'error', error: error.message }
      } else {
        checks.db_connection = { status: 'ok', value: `${count ?? 0} active users` }
      }
    } else {
      checks.db_connection = { status: 'error', error: 'Query failed' }
    }

    // Compute overall status
    const errorCount = Object.values(checks).filter(c => c.status === 'error').length
    const overallStatus = errorCount === 0 ? 'healthy' : errorCount < 3 ? 'degraded' : 'unhealthy'

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      checks,
      summary: {
        contacts_last_hour: checks.contacts_1h.status === 'ok' ? checks.contacts_1h.value : null,
        purchases_last_24h: checks.purchases_24h.status === 'ok' ? checks.purchases_24h.value : null,
        pending_notifications: checks.unread_notifications.status === 'ok' ? checks.unread_notifications.value : null,
        overdue_recontacts: checks.overdue_contacts.status === 'ok' ? checks.overdue_contacts.value : null,
      },
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    console.error('[Ops Health] Unexpected error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}

