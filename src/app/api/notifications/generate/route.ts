import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor } from '@/lib/auth'

// POST /api/notifications/generate - Generate overdue and inactivity notifications
// Can be called by cron or manually by supervisor
export async function POST(request: Request) {
  try {
    // Require supervisor role (or use a cron secret for automated calls)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Cron job - proceed without user auth
    } else {
      // Manual call - require supervisor
      await requireSupervisor()
    }

    const supabase = await createClient()

    // Generate overdue notifications
    const { data: overdueResult, error: overdueError } = await supabase
      .rpc('generate_overdue_notifications')

    if (overdueError) {
      console.error('Overdue notifications error:', overdueError)
    }

    // Generate seller inactivity alerts
    const { data: inactivityResult, error: inactivityError } = await supabase
      .rpc('generate_seller_inactivity_alerts')

    if (inactivityError) {
      console.error('Inactivity alerts error:', inactivityError)
    }

    return NextResponse.json({
      success: true,
      overdue_notifications: overdueResult || 0,
      inactivity_alerts: inactivityResult || 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate notifications'
    const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 500
    return NextResponse.json({ error: message }, { status })
  }
}
