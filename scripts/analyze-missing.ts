import { readFileSync } from 'fs'
import Papa from 'papaparse'

const csv = readFileSync('data/casablanca/clients_clean.csv', 'utf-8')
const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })

let noNameNoContact = 0
let badNameHasContact = 0
let goodNameNoContact = 0
let fullyValid = 0
const samples: Array<{ row: number; fn: string; ln: string; email: string; phone: string; seller: string }> = []

data.forEach((row, i) => {
  const fn = row.first_name?.trim() || ''
  const ln = row.last_name?.trim() || ''
  const email = row.email?.trim() || ''
  const phone = row.phone?.trim() || ''

  const isNA = fn === '#N/A' || fn === '0' || ln === '#N/A' || ln === '0' || !fn || !ln
  const hasContact = (email.length > 3) || (phone.length > 5)

  if (isNA && !hasContact) {
    noNameNoContact++
  } else if (isNA && hasContact) {
    badNameHasContact++
    if (samples.length < 15) {
      samples.push({ row: i + 2, fn, ln, email, phone, seller: row.seller || '' })
    }
  } else if (!hasContact) {
    goodNameNoContact++
  } else {
    fullyValid++
  }
})

console.log('═══════════════════════════════════════════════════════════════')
console.log('              MISSING ROW ANALYSIS')
console.log('═══════════════════════════════════════════════════════════════')
console.log('')
console.log(`No name + no contact (minimal data):  ${noNameNoContact}`)
console.log(`Bad name but HAS email/phone:         ${badNameHasContact}`)
console.log(`Good name but no contact:             ${goodNameNoContact}`)
console.log(`Fully valid (name + contact):         ${fullyValid}`)
console.log('')
console.log(`TOTAL:                                ${data.length}`)
console.log('')
console.log('Recoverable samples (bad name + has contact):')
samples.forEach(s => {
  console.log(`  Row ${s.row} | "${s.fn}" "${s.ln}" | ${s.email || '(no email)'} | ${s.phone || '(no phone)'} | ${s.seller}`)
})
console.log('')
console.log('═══════════════════════════════════════════════════════════════')
