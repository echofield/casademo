import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { createPostSizingHandler } from './post-handler'

// POST /api/clients/[id]/sizing — create or update one size entry per item type
export const POST = createPostSizingHandler()

// DELETE /api/clients/[id]/sizing — remove a size entry by category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id: client_id } = await params

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_sizing')
      .delete()
      .eq('client_id', client_id)
      .eq('category', category.toLowerCase())

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
