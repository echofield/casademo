import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/auth'
import type { NotificationRow } from '@/lib/types'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoNotifications } from '@/lib/demo/presentation-data'

const NO_RETRY_HEADERS = {
  'Cache-Control': 'no-store',
  'Retry-After': '0',
  'X-No-Retry': 'true',
}

function authFailureResponse(error: AuthError) {
  return NextResponse.json(
    { error: error.message },
    {
      status: error.status,
      headers: error.status === 401 ? NO_RETRY_HEADERS : undefined,
    }
  )
}

function isMissingDueAtColumn(error: { code?: string; message?: string }) {
  return (
    error.code === '42703' ||
    (error.message?.toLowerCase().includes('due_at') === true &&
      error.message?.toLowerCase().includes('column') === true)
  )
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    if (isDemoMode) {
      return NextResponse.json(getDemoNotifications(user.effectiveRole))
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const nowIso = new Date().toISOString()

    const fetchNotifications = async (useDueAt: boolean) => {
      let query = supabase.from('notifications').select('*').eq('user_id', user.id)

      if (useDueAt) {
        query = query.lte('due_at', nowIso)
      }

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      if (useDueAt) {
        query = query.order('due_at', { ascending: false }).order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      return await query.limit(50)
    }

    let useDueAt = true
    let { data, error } = await fetchNotifications(true)

    if (error && isMissingDueAtColumn(error)) {
      useDueAt = false
      const fallback = await fetchNotifications(false)
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      const missing = error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')
      console.warn('Notifications query failed:', error.message)
      return NextResponse.json({
        notifications: [] as NotificationRow[],
        unread_count: 0,
        ...(missing ? { setup_required: true as const } : { fetch_error: true as const }),
      })
    }

    const fetchUnreadCount = async (withDueAt: boolean) => {
      let query = supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
      if (withDueAt) query = query.lte('due_at', nowIso)
      return await query
    }

    let { count, error: countError } = await fetchUnreadCount(useDueAt)

    if (countError && useDueAt && isMissingDueAtColumn(countError)) {
      const fallbackCount = await fetchUnreadCount(false)
      count = fallbackCount.count
      countError = fallbackCount.error
    }

    if (countError) {
      console.warn('Notifications unread count query failed:', countError.message)
    }

    return NextResponse.json({ notifications: (data || []) as NotificationRow[], unread_count: count ?? 0 })
  } catch (error) {
    if (error instanceof AuthError) {
      return authFailureResponse(error)
    }

    console.error('Notifications error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ notifications: [], unread_count: 0 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()

    if (isDemoMode) {
      return NextResponse.json({ success: true, demo: true })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { notification_ids, mark_all } = body
    let updateError: string | null = null

    if (mark_all) {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
      if (error) {
        const isSetupIssue = error.code === '42P01' || error.message.includes('does not exist')
        if (!isSetupIssue) {
          console.warn('[Notifications] PATCH mark_all failed:', error.message)
          updateError = error.message
        }
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).in('id', notification_ids)
      if (error) {
        const isSetupIssue = error.code === '42P01' || error.message.includes('does not exist')
        if (!isSetupIssue) {
          console.warn('[Notifications] PATCH by ids failed:', error.message)
          updateError = error.message
        }
      }
    }

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return authFailureResponse(error)
    }

    console.error('[Notifications] PATCH unexpected error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ success: false, error: 'Unexpected error' })
  }
}

