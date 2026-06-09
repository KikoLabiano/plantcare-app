import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useContainer } from '@/di/container'
import { WateringStatusBadge } from '@/ui/components/WateringStatusBadge/WateringStatusBadge'
import styles from './PlantDetailPage.module.css'

const LIGHT_LABELS = {
  low: 'Sombra',
  medium: 'Luz indirecta',
  high: 'Mucha luz',
  direct: 'Sol directo',
}

const WATER_LABELS = {
  low: 'Poco',
  medium: 'Moderado',
  high: 'Abundante',
}

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getWateringHistory, waterPlant } = useContainer()
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: ['watering-history', id],
    queryFn: () => getWateringHistory.execute(id!),
    enabled: !!id,
  })

  const plantsQuery = useQuery({
    queryKey: ['plants'],
    queryFn: () => {
      // reuse cached data
      return queryClient.getQueryData<Awaited<ReturnType<typeof import('@/core/plants/usecases/GetPlants').GetPlants.prototype.execute>>>(['plants'])
    },
    enabled: false,
  })

  const plant = queryClient
    .getQueryData<Awaited<ReturnType<typeof import('@/core/plants/usecases/GetPlants').GetPlants.prototype.execute>>>(['plants'])
    ?.plantsWithStatus
    .find((p) => p.plant.id.value === id)

  const waterMutation = useMutation({
    mutationFn: () => waterPlant.execute({ plantId: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['watering-history', id] })
    },
  })

  if (!plant) {
    return (
      <main className="page">
        <button onClick={() => navigate(-1)} className={styles.back}>← Volver</button>
        <p className="text-muted text-center">Planta no encontrada</p>
      </main>
    )
  }

  const { plant: p, status, nextWateringAt, lastWateredAt } = plant
  const history = historyQuery.data?.records ?? []

  return (
    <main className="page">
      <button onClick={() => navigate(-1)} className={styles.back}>← Volver</button>

      {/* Hero photo */}
      {p.photoUrl ? (
        <img
          src={p.photoUrl}
          alt={p.name}
          className="plant-hero"
        />
      ) : (
        <div className="plant-hero__placeholder" aria-hidden="true">🪴</div>
      )}

      {/* Header */}
      <div>
        <WateringStatusBadge status={status} nextWateringAt={nextWateringAt} />
        <h1 className="page-title" style={{ marginTop: 'var(--sp-2)' }}>
          {p.displayName()}
        </h1>
        {p.species && (
          <p className="page-subtitle" style={{ fontStyle: 'italic' }}>{p.species}</p>
        )}
      </div>

      {/* Water now button */}
      <button
        className={`btn btn--primary btn--full btn--lg ${styles.waterBtn}`}
        onClick={() => waterMutation.mutate()}
        disabled={waterMutation.isPending}
        id="btn-water-now"
      >
        {waterMutation.isPending ? 'Registrando…' : '💧 Regar ahora'}
      </button>

      {/* Care info */}
      {p.careInfo && (
        <section aria-labelledby="care-heading">
          <h2 id="care-heading" className="section-label">Cuidados</h2>
          <div className="care-grid" style={{ marginTop: 'var(--sp-3)' }}>
            {p.careInfo.light && (
              <div className="care-item">
                <span className="care-item__icon" aria-hidden="true">☀️</span>
                <span className="care-item__label">Luz</span>
                <span className="care-item__value">{LIGHT_LABELS[p.careInfo.light]}</span>
              </div>
            )}
            {p.careInfo.water && (
              <div className="care-item">
                <span className="care-item__icon" aria-hidden="true">💧</span>
                <span className="care-item__label">Agua</span>
                <span className="care-item__value">{WATER_LABELS[p.careInfo.water]}</span>
              </div>
            )}
            {(p.careInfo.temperatureMin || p.careInfo.temperatureMax) && (
              <div className="care-item">
                <span className="care-item__icon" aria-hidden="true">🌡️</span>
                <span className="care-item__label">Temp.</span>
                <span className="care-item__value">
                  {p.careInfo.temperatureMin ?? '?'}–{p.careInfo.temperatureMax ?? '?'}°
                </span>
              </div>
            )}
          </div>
          {p.careInfo.notes && (
            <p className={styles.careNotes}>{p.careInfo.notes}</p>
          )}
        </section>
      )}

      {/* Watering frequency info */}
      <div className={styles.frequencyRow}>
        <span style={{ color: 'var(--clr-muted)', fontSize: 'var(--text-sm)' }}>
          Cada {p.wateringFrequency.days} día{p.wateringFrequency.days !== 1 ? 's' : ''}
        </span>
        {lastWateredAt && (
          <span style={{ color: 'var(--clr-muted)', fontSize: 'var(--text-sm)' }}>
            Último riego: {lastWateredAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Watering history */}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="section-label">Historial de riegos</h2>

        {historyQuery.isLoading && (
          <p className="text-muted" style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}>
            Cargando historial…
          </p>
        )}

        {history.length === 0 && !historyQuery.isLoading && (
          <p className="text-muted" style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}>
            Aún no hay riegos registrados.
          </p>
        )}

        {history.length > 0 && (
          <div className="watering-timeline" style={{ marginTop: 'var(--sp-4)' }}>
            {history.map((record) => (
              <div key={record.id.value} className="watering-entry">
                <div className="watering-entry__dot" aria-hidden="true">💧</div>
                <div>
                  <p className="watering-entry__date">
                    {record.wateredAt.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  <p className="watering-entry__meta">
                    {record.wateredBy && `${record.wateredBy} · `}
                    {record.amountMl && `${record.amountMl}ml · `}
                    {record.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
