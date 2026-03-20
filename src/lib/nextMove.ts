import type { Client360 } from '@/lib/types'

export interface NextMoveContext {
  headline: string
  detail: string
  urgent: boolean
}

/** Vendor-facing copy for the “what’s next” card (French). */
export function getNextMoveContext(client: Client360): NextMoveContext {
  const next = client.next_recontact_date
  if (!next) {
    return {
      headline: 'Planifier le prochain contact',
      detail:
        'Aucune date de recontact enregistrée. Enregistrez un contact ou une note pour cadrer le suivi.',
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
      headline: `Recontact en retard · ${n} jour${n > 1 ? 's' : ''}`,
      detail: `La date prévue était le ${due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Prioriser un appel ou un message.`,
      urgent: true,
    }
  }
  if (diffDays === 0) {
    return {
      headline: 'À contacter aujourd’hui',
      detail: 'Ce client est dans la fenêtre du jour. Une prise de contact met à jour l’historique et la prochaine échéance.',
      urgent: true,
    }
  }
  if (diffDays <= 7) {
    return {
      headline: `Prochain contact dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
      detail: `Échéance : ${due.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
      urgent: false,
    }
  }
  return {
    headline: `Prochain recontact le ${due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
    detail: `D’ici là, vous pouvez enrichir la fiche (achat, centre d’intérêt) après chaque interaction.`,
    urgent: false,
  }
}
