import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const domain = request.nextUrl.searchParams.get('domain') || undefined

    let query = supabase
      .from('interest_taxonomy')
      .select('category, value, display_label, domain')
      .order('category')
      .order('sort_order')

    if (domain) {
      query = query.eq('domain', domain)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
