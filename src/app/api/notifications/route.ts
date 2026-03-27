import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/auth'
import type { NotificationRow } from '@/lib/types'

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

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
      const missing =
        error.code === '42P01' ||
        error.message.includes('relation') ||
        error.message.includes('does not exist')
      console.warn('Notifications query failed:', error.message)
      return NextResponse.json({
        notifications: [] as NotificationRow[],
        unread_count: 0,
        ...(missing ? { setup_required: true as const } : { fetch_error: true as const }),
      })
    }

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: (data || []) as NotificationRow[],
      unread_count: count ?? 0,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return authFailureResponse(error)
    }

    // For any other error, return empty state to avoid breaking the UI
    console.error('Notifications error:', error)
    return NextResponse.json({
      notifications: [],
      unread_count: 0,
    })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    // Mark specific notifications or all as read
    const { notification_ids, mark_all } = body
    let updateError: string | null = null

    if (mark_all) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        // Table not found is expected during setup; other errors are real failures
        const isSetupIssue = error.code === '42P01' || error.message.includes('does not exist')
        if (!isSetupIssue) {
          console.warn('[Notifications] PATCH mark_all failed:', error.message)
          updateError = error.message
        }
      }
    } else if (notification_ids && Array.isArray(notification_ids)) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notification_ids)

      if (error) {
        const isSetupIssue = error.code === '42P01' || error.message.includes('does not exist')
        if (!isSetupIssue) {
          console.warn('[Notifications] PATCH by ids failed:', error.message)
          updateError = error.message
        }
      }
    }

    // Return honest status (200 for now, frontend should eventually handle success: false)
    // TODO: Once frontend handles errors gracefully, return 500 on real failures
    if (updateError) {
      return NextResponse.json({ success: false, error: updateError })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return authFailureResponse(error)
    }

    // Real unexpected error - log and return failure
    console.error('[Notifications] PATCH unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Unexpected error' })
  }
}
