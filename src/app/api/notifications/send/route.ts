import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only supervisors can send notifications
    if (user.effectiveRole !== 'supervisor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { seller_id, client_id, client_name, message } = body

    if (!seller_id) {
      return NextResponse.json({ error: 'seller_id required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Create notification for the seller
    const { error } = await supabase.from('notifications').insert({
      user_id: seller_id,
      type: 'manual',
      title: client_name ? `Reminder: ${client_name}` : 'Supervisor reminder',
      message: message || 'Please check your queue',
      client_id: client_id || null,
    })

    if (error) {
      console.error('Failed to create notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Notification send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
