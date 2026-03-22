const dateOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'Europe/Paris',
  day: 'numeric',
  month: 'short',
}

export function formatQueueDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', dateOptions)
}

export function formatCurrencyEUR(amount: number | null): string {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount)
}
