import { NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoSellerRoster } from '@/lib/demo/presentation-data'

export type SellerOption = {
  id: string
  full_name: string
  role: 'seller' | 'supervisor'
}

// GET /api/sellers — returns active sellers for dropdowns
export async function GET() {
  try {
    await requireAuth()

    if (isDemoMode) {
      const sellers: SellerOption[] = getDemoSellerRoster().map((s) => ({
        id: s.id,
        full_name: s.full_name,
        role: s.role as 'seller' | 'supervisor',
      }))
      return NextResponse.json({ data: sellers })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['seller', 'supervisor'])
      .order('full_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
