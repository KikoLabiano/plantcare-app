import type { WateringStatus } from '@/core/plants/domain/Plant'

interface StatusBadgeProps {
  status: WateringStatus
  nextWateringAt: Date | null
}

const STATUS_LABELS: Record<WateringStatus, string> = {
  overdue: 'Necesita agua',
  'due-today': 'Regar hoy',
  'due-soon': 'Pronto',
  ok: 'Al día',
}

export function WateringStatusBadge({ status, nextWateringAt }: StatusBadgeProps) {
  const label = STATUS_LABELS[status]

  const daysText = (() => {
    if (!nextWateringAt) return null
    const diff = Math.ceil(
      (nextWateringAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (diff < 0) return `hace ${Math.abs(diff)}d`
    if (diff === 0) return 'hoy'
    return `en ${diff}d`
  })()

  return (
    <span className={`status-badge status-badge--${status}`}>
      {label}
      {daysText && <span style={{ opacity: 0.7 }}> · {daysText}</span>}
    </span>
  )
}
