import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'
import type { ImportResult } from '@/lib/types'
import {
  type CsvRow,
  prepareRowFromCsv,
  importPreparedRow,
  profilesToSellerMap,
  type ImportCounters,
} from '@/lib/import/cleanupImport'

// POST /api/import - CSV bulk import (supervisor only)
export async function POST(request: NextRequest) {
  try {
    await requireSupervisor()
    const supabase = await createClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const { data: rows, errors: parseErrors } = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseErrors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', details: parseErrors },
        { status: 400 }
      )
    }

    const { data: sellers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('active', true)

    const sellerMap = profilesToSellerMap(sellers || [])

    const result: ImportResult = {
      created: 0,
      skipped: 0,
      errors: [],
    }

    const counters: ImportCounters = {
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    }

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2
      const prepared = prepareRowFromCsv(rows[i], rowNum)

      if (!prepared.ok) {
        result.errors.push({ row: rowNum, message: prepared.message })
        continue
      }

      const sellerId = sellerMap.get(prepared.data.sellerKey)
      if (!sellerId) {
        result.errors.push({
          row: rowNum,
          message: `Seller not found: ${prepared.data.sellerKey}`,
        })
        continue
      }

      await importPreparedRow(supabase, sellerId, prepared.data, rowNum, counters)
    }

    result.created = counters.created
    result.skipped = counters.skipped

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
