import type { Client360 } from '@/lib/types'

export interface NextMoveContext {
  headline: string
  detail: string
  urgent: boolean
}

/** Vendor-facing copy for the "what's next" card (English). */
export function getNextMoveContext(client: Client360): NextMoveContext {
  const next = client.next_recontact_date
  if (!next) {
    return {
      headline: 'Schedule next contact',
      detail:
        'No follow-up date recorded. Log a contact or note to set up tracking.',
      urgent: false,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(next)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    return {
      headline: `Follow-up overdue · ${n} day${n > 1 ? 's' : ''}`,
      detail: `Due date was ${due.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Prioritize a call or message.`,
      urgent: true,
    }
  }
  if (diffDays === 0) {
    return {
      headline: 'Contact due today',
      detail: 'This client is in today\'s window. Reaching out updates the history and sets the next due date.',
      urgent: true,
    }
  }
  if (diffDays <= 7) {
    return {
      headline: `Next contact in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      detail: `Due: ${due.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`,
      urgent: false,
    }
  }
  return {
    headline: `Next follow-up on ${due.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
    detail: `Until then, you can enrich the profile (purchase, interest) after each interaction.`,
    urgent: false,
  }
}
