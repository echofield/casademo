import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError, isSupervisor } from '@/lib/auth'

// GET /api/recontact-queue - Get overdue/due recontact list
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    let query = supabase.from('recontact_queue').select('*')

    // Sellers only see their own clients
    if (!isSupervisor(user.profile)) {
      query = query.eq('seller_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count: data?.length || 0,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
