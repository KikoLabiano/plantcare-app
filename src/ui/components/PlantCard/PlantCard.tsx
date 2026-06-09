import { useNavigate } from 'react-router-dom'
import type { PlantWithStatus } from '@/core/plants/domain/Plant'
import { WateringStatusBadge } from '@/ui/components/WateringStatusBadge/WateringStatusBadge'
import styles from './PlantCard.module.css'

interface PlantCardProps {
  plantWithStatus: PlantWithStatus
  onQuickWater: (plantId: string) => void
}

export function PlantCard({ plantWithStatus, onQuickWater }: PlantCardProps) {
  const { plant, status, nextWateringAt } = plantWithStatus
  const navigate = useNavigate()

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickWater(plant.id.value)
  }

  return (
    <article
      className={`plant-card animate-fade-up`}
      data-status={status}
      onClick={() => navigate(`/plants/${plant.id.value}`)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${plant.displayName()}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/plants/${plant.id.value}`)}
    >
      {/* Plant photo */}
      <div className="plant-card__photo" aria-hidden="true">
        {plant.photoUrl ? (
          <img src={plant.photoUrl} alt={plant.name} className={styles.photo} />
        ) : (
          <span>🪴</span>
        )}
      </div>

      {/* Body */}
      <div className="plant-card__body">
        <h3 className="plant-card__name">{plant.displayName()}</h3>
        {plant.species && (
          <p className="plant-card__species">{plant.species}</p>
        )}
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <WateringStatusBadge status={status} nextWateringAt={nextWateringAt} />
        </div>
      </div>

      {/* Quick water button */}
      <button
        className="btn-water"
        onClick={handleWater}
        aria-label={`Regar ${plant.displayName()} ahora`}
        title="Regar ahora"
      >
        <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>💧</span>
      </button>
    </article>
  )
}
