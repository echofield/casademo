/**
 * Import clients_clean.csv (Casablanca cleanup) into Supabase with pre/post verification.
 *
 * 1) npm run seed:casablanca-team   (once)
 * 2) npm run import:casablanca      (or --dry-run)
 *
 * CSV path: CASABLANCA_CSV env or data/casablanca/clients_clean.csv
 */
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

import {
  CASABLANCA_IMPORT_TAG,
  type CsvRow,
  prepareRowFromCsv,
  importPreparedRow,
  profilesToSellerMap,
  type ImportCounters,
} from '../src/lib/import/cleanupImport'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const REPORT_EXPECT_CLIENTS = 1405

function resolveCsvPath(): string {
  const env = process.env.CASABLANCA_CSV
  if (env && existsSync(env)) return env
  const def = path.join(process.cwd(), 'data', 'casablanca', 'clients_clean.csv')
  return def
}

interface PreStats {
  dataRows: number
  preparedOk: number
  prepareErrors: number
  sumSpend: number
  tierCounts: Record<string, number>
  sellerKeys: Set<string>
  samples: string[]
}

function computePreStats(rows: CsvRow[]): PreStats {
  const tierCounts: Record<string, number> = {}
  const sellerKeys = new Set<string>()
  let preparedOk = 0
  let prepareErrors = 0
  let sumSpend = 0
  const samples: string[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const r = prepareRowFromCsv(row, rowNum)
    if (!r.ok) {
      prepareErrors++
      if (samples.length < 8) samples.push(`Row ${rowNum}: ${r.message}`)
      return
    }
    preparedOk++
    sumSpend += r.data.totalSpend
    sellerKeys.add(r.data.sellerKey)
    const t = r.data.tierHint || 'rainbow'
    tierCounts[t] = (tierCounts[t] || 0) + 1
  })

  return {
    dataRows: rows.length,
    preparedOk,
    prepareErrors,
    sumSpend,
    tierCounts,
    sellerKeys,
    samples,
  }
}

async function postVerify(expectedCreated: number, expectedSpendSum: number) {
  const { count: taggedCount, error: cErr } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .ilike('notes', `%${CASABLANCA_IMPORT_TAG}%`)

  if (cErr) {
    console.error('Post-verify count failed:', cErr.message)
    return
  }

  const { data: spendRows, error: sErr } = await supabase
    .from('clients')
    .select('total_spend')
    .ilike('notes', `%${CASABLANCA_IMPORT_TAG}%`)

  if (sErr) {
    console.error('Post-verify sum failed:', sErr.message)
    return
  }

  const dbSpend = (spendRows || []).reduce((a, r) => a + Number(r.total_spend || 0), 0)

  console.log('\n── Post-import verification ──')
  console.log(`Tagged clients in DB: ${taggedCount ?? 0} (expected ${expectedCreated} if no prior import)`)
  console.log(`Sum total_spend (tagged): ${dbSpend.toFixed(2)} (import batch spend was ${expectedSpendSum.toFixed(2)})`)

  const countOk = taggedCount === expectedCreated
  const spendOk = Math.abs(dbSpend - expectedSpendSum) < 0.02 * Math.max(expectedSpendSum, 1)
  if (countOk && spendOk) {
    console.log('Verification: OK (counts and spend match this run)')
  } else {
    if (!countOk) {
      console.warn(
        'Verification: client count mismatch — re-run on empty DB, or delete tagged rows before re-import.'
      )
    }
    if (!spendOk) {
      console.warn('Verification: spend mismatch — check skipped duplicates or partial failures.')
    }
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const csvPath = resolveCsvPath()

  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    console.error('Copy cleanup_output/clients_clean.csv to data/casablanca/ or set CASABLANCA_CSV.')
    process.exit(1)
  }

  const text = readFileSync(csvPath, 'utf-8')
  const { data: rows, errors: parseErrors } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parseErrors.length) {
    console.error('CSV parse errors:', parseErrors)
    process.exit(1)
  }

  const pre = computePreStats(rows)
  console.log('── Pre-import verification (from CSV) ──')
  console.log(`File: ${csvPath}`)
  console.log(`Data rows: ${pre.dataRows}`)
  console.log(`Prepared OK: ${pre.preparedOk} | prepare errors: ${pre.prepareErrors}`)
  console.log(`Unique sellers in CSV: ${pre.sellerKeys.size}`)
  console.log(`Sum total_spend (prepared rows): ${pre.sumSpend.toFixed(2)}`)
  console.log('Tier counts (hint from CSV):', pre.tierCounts)
  console.log(`Cleanup report expected ~${REPORT_EXPECT_CLIENTS} clients; prepared ${pre.preparedOk} (delta = data quality / dropped rows)`)
  if (pre.samples.length) {
    console.log('Sample prepare errors:', pre.samples)
  }

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('active', true)

  if (pErr || !profiles) {
    console.error('Failed to load seller profiles:', pErr?.message)
    process.exit(1)
  }

  const sellerMap = profilesToSellerMap(profiles)
  const missingSellers: string[] = []
  for (const key of pre.sellerKeys) {
    if (!sellerMap.get(key)) missingSellers.push(key)
  }

  if (missingSellers.length) {
    console.error('\nMissing profile for seller name(s) — run npm run seed:casablanca-team first:')
    missingSellers.forEach((s) => console.error(`  - "${s}"`))
    process.exit(1)
  }

  console.log('\nSeller name coverage: OK (all CSV sellers map to profiles)')

  if (dryRun) {
    console.log('\n--dry-run: no database writes.')
    process.exit(0)
  }

  const counters: ImportCounters = { created: 0, skipped: 0, errors: [] }
  let importedSpendSum = 0

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2
    const prepared = prepareRowFromCsv(rows[i], rowNum)
    if (!prepared.ok) continue

    const sellerId = sellerMap.get(prepared.data.sellerKey)
    if (!sellerId) {
      counters.errors.push({ row: rowNum, message: 'Seller not found' })
      continue
    }

    const before = counters.created
    await importPreparedRow(supabase, sellerId, prepared.data, rowNum, counters)
    if (counters.created > before) {
      importedSpendSum += prepared.data.totalSpend
    }
  }

  console.log('\n── Import result ──')
  console.log(JSON.stringify(counters, null, 2))

  await postVerify(counters.created, importedSpendSum)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
