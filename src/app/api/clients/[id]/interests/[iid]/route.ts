import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

// DELETE /api/clients/[id]/interests/[iid] — soft delete (is_deleted + deleted_at)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; iid: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id: client_id, iid: interest_id } = await params

    const { data: existing, error: fetchErr } = await supabase
      .from('client_interests')
      .select('id, client_id')
      .eq('id', interest_id)
      .eq('client_id', client_id)
      .eq('is_deleted', false)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('client_interests')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      } as any)
      .eq('id', interest_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
