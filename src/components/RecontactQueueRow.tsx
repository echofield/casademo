'use client'

import { useRouter } from 'next/navigation'
import { TierBadge } from './TierBadge'
import { ClickableSellerBadge } from './ClickableSellerBadge'
import type { RecontactQueueItem } from '@/lib/types'

interface RecontactQueueRowProps {
  item: RecontactQueueItem
  urgent?: boolean
  spendLabel: string
  lastContactLabel: string
  nextRecontactLabel: string
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
}

export function RecontactQueueRow({
  item,
  urgent = false,
  spendLabel,
  lastContactLabel,
  nextRecontactLabel,
  userRole = 'seller',
  currentUserId,
}: RecontactQueueRowProps) {
  const router = useRouter()
  const href = `/clients/${item.id}`

  const openClient = () => {
    router.push(href)
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openClient}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openClient()
        }
      }}
      className={`block cursor-pointer border bg-surface p-5 transition-colors duration-200 hover:bg-bg-soft md:p-6 ${
        urgent ? 'border-l-[3px]' : ''
      }`}
      style={{
        borderColor: 'rgba(28, 27, 25, 0.08)',
        ...(urgent ? { borderLeftColor: '#C34747' } : {}),
      }}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-xl text-text md:text-2xl">
              {item.first_name} {item.last_name}
            </h3>
            <TierBadge tier={item.tier} />
          </div>
          <div className="flex flex-wrap items-center gap-4 body-small text-text-muted">
            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="transition-colors duration-200 hover:text-primary"
              >
                {item.phone}
              </a>
            )}
            <span className="text-text">{spendLabel}</span>
            {item.seller_name && item.seller_id && (
              <ClickableSellerBadge
                sellerId={item.seller_id}
                sellerName={item.seller_name}
                clientId={item.id}
                clientName={`${item.first_name} ${item.last_name}`}
                isOverdue={(item.days_overdue ?? 0) > 0}
                daysOverdue={item.days_overdue ?? 0}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6 text-sm md:items-center">
          <div className="text-right">
            <p className="label mb-1 text-text-muted">Last contact</p>
            <p className="text-text">{lastContactLabel}</p>
          </div>
          <div className="text-right">
            <p className="label mb-1 text-text-muted">Due</p>
            <p className={urgent || (item.days_overdue ?? 0) > 0 ? 'font-medium text-danger' : 'text-text'}>
              {nextRecontactLabel}
              {(item.days_overdue ?? 0) > 0 && <span className="ml-1">+{item.days_overdue}d</span>}
            </p>
          </div>

          {item.phone && (
            <a
              href={`https://wa.me/${item.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-primary/20 text-primary transition-colors duration-200 hover:bg-primary-soft"
              title="WhatsApp"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
