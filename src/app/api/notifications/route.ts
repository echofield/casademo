import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

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

    if (error) throw error

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: data || [],
      unread_count: count || 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 500
    return NextResponse.json({ error: message }, { status })
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

    if (mark_all) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
    } else if (notification_ids && Array.isArray(notification_ids)) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notification_ids)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
