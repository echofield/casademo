import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only supervisors can send notifications to others
    if (user.effectiveRole !== 'supervisor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { seller_id, client_id, client_name, message } = body

    if (!seller_id) {
      return NextResponse.json({ error: 'seller_id required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Try using the send_notification function first (bypasses RLS)
    const { data: funcResult, error: funcError } = await supabase.rpc('send_notification', {
      p_user_id: seller_id,
      p_type: 'manual',
      p_title: client_name ? `Reminder: ${client_name}` : 'Supervisor reminder',
      p_message: message || 'Please check your queue',
      p_client_id: client_id || null,
    })

    if (!funcError) {
      return NextResponse.json({ success: true, notification_id: funcResult })
    }

    // Fallback to direct insert if function doesn't exist
    if (funcError.code === '42883') { // function does not exist
      const { error: insertError } = await supabase.from('notifications').insert({
        user_id: seller_id,
        type: 'manual',
        title: client_name ? `Reminder: ${client_name}` : 'Supervisor reminder',
        message: message || 'Please check your queue',
        client_id: client_id || null,
      })

      if (insertError) {
        console.error('Failed to create notification:', insertError)
        // Check if it's an RLS error
        if (insertError.code === '42501') {
          return NextResponse.json({
            error: 'Permission denied. Please run migration 020_notifications_supervisor_policy.sql',
            code: 'RLS_ERROR'
          }, { status: 403 })
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    console.error('RPC error:', funcError)
    return NextResponse.json({ error: funcError.message }, { status: 500 })
  } catch (err) {
    console.error('Notification send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
