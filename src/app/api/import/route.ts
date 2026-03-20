import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'
import type { ImportResult } from '@/lib/types'

interface CsvRow {
  [key: string]: string | undefined
}

// Column name mapping (flexible)
const COLUMN_MAP: Record<string, string[]> = {
  first_name: ['prenom', 'first_name', 'firstname', 'prénom'],
  last_name: ['nom', 'last_name', 'lastname', 'name'],
  email: ['email', 'mail', 'e-mail'],
  phone: ['telephone', 'phone', 'tel', 'téléphone', 'mobile'],
  seller: ['vendeur', 'seller', 'sales_rep', 'commercial'],
  total_spend: ['total_achats', 'total_spend', 'total', 'montant'],
  first_contact_date: ['date_premier_contact', 'first_contact', 'premiere_date'],
  last_contact_date: ['date_dernier_contact', 'last_contact', 'derniere_date'],
  interests: ['interets', 'interests', 'intérêts', 'preferences'],
  notes: ['notes', 'commentaire', 'comment', 'remarques'],
}

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
}

function findColumn(row: CsvRow, field: string): string | undefined {
  const aliases = COLUMN_MAP[field] || []
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeColumnName(key) === normalizeColumnName(alias)) {
        return row[key]
      }
    }
  }
  // Direct match
  for (const key of Object.keys(row)) {
    if (normalizeColumnName(key) === normalizeColumnName(field)) {
      return row[key]
    }
  }
  return undefined
}

function parseInterests(raw: string | undefined): Array<{ category: string; value: string }> {
  if (!raw) return []

  // Support formats: "fashion:sneakers, food:japanese" or "sneakers, japanese"
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.includes(':')) {
        const [category, value] = item.split(':').map((s) => s.trim())
        return { category, value }
      }
      // Default to 'fashion' category if not specified
      return { category: 'fashion', value: item }
    })
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null

  // Try common date formats
  const date = new Date(raw)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }

  // Try DD/MM/YYYY format
  const parts = raw.split(/[\/\-.]/)
  if (parts.length === 3) {
    const [d, m, y] = parts
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }

  return null
}

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

    // Get all sellers for name matching
    const { data: sellers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('active', true)

    const sellerMap = new Map<string, string>()
    sellers?.forEach((s) => {
      sellerMap.set(s.full_name.toLowerCase(), s.id)
      sellerMap.set(s.email.toLowerCase(), s.id)
    })

    const result: ImportResult = {
      created: 0,
      skipped: 0,
      errors: [],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // 1-indexed + header

      try {
        const firstName = findColumn(row, 'first_name')
        const lastName = findColumn(row, 'last_name')
        const sellerName = findColumn(row, 'seller')

        if (!firstName || !lastName) {
          result.errors.push({ row: rowNum, message: 'Missing first_name or last_name' })
          continue
        }

        if (!sellerName) {
          result.errors.push({ row: rowNum, message: 'Missing seller' })
          continue
        }

        const sellerId = sellerMap.get(sellerName.toLowerCase())
        if (!sellerId) {
          result.errors.push({ row: rowNum, message: `Seller not found: ${sellerName}` })
          continue
        }

        const email = findColumn(row, 'email') || null
        const phone = findColumn(row, 'phone') || null

        // Check for duplicates
        if (email || phone) {
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .or(`email.eq.${email},phone.eq.${phone}`)
            .limit(1)

          if (existing && existing.length > 0) {
            result.skipped++
            continue
          }
        }

        // Create client
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            seller_id: sellerId,
            first_contact_date: parseDate(findColumn(row, 'first_contact_date')),
            last_contact_date: parseDate(findColumn(row, 'last_contact_date')),
            notes: findColumn(row, 'notes') || null,
          } as any)
          .select()
          .single()

        if (clientError || !client) {
          result.errors.push({ row: rowNum, message: clientError?.message || 'Insert failed' })
          continue
        }

        // Seed purchase if total_spend > 0
        const totalSpendRaw = findColumn(row, 'total_spend')
        if (totalSpendRaw) {
          const totalSpend = parseFloat(totalSpendRaw.replace(/[^0-9.]/g, ''))
          if (totalSpend > 0) {
            await supabase.from('purchases').insert({
              client_id: client.id,
              seller_id: sellerId,
              amount: totalSpend,
              description: 'Historical spend (imported)',
              purchase_date: parseDate(findColumn(row, 'last_contact_date')) || new Date().toISOString().split('T')[0],
            } as any)
          }
        }

        // Parse and insert interests
        const interests = parseInterests(findColumn(row, 'interests'))
        if (interests.length > 0) {
          await supabase.from('client_interests').insert(
            interests.map((i) => ({
              client_id: client.id,
              category: i.category,
              value: i.value,
            })) as any
          )
        }

        result.created++
      } catch (err) {
        result.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
