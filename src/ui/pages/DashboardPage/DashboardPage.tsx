import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlantCard } from '@/ui/components/PlantCard/PlantCard'
import { useContainer } from '@/di/container'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { getPlants, waterPlant } = useContainer()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants.execute(),
  })

  const waterMutation = useMutation({
    mutationFn: (plantId: string) =>
      waterPlant.execute({ plantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
    },
  })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 13) return 'Buenos días'
    if (h < 20) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  if (isLoading) return <LoadingSkeleton />

  if (isError) {
    return (
      <main className="page">
        <p className="text-muted text-center">Error cargando las plantas. Intenta de nuevo.</p>
      </main>
    )
  }

  const plants = data?.plantsWithStatus ?? []
  const overdueCount = plants.filter(
    (p) => p.status === 'overdue' || p.status === 'due-today',
  ).length

  return (
    <main className="page">
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="page-subtitle">{greeting}</p>
          <h1 className="page-title">
            {overdueCount > 0 ? (
              <>
                {overdueCount} {overdueCount === 1 ? 'planta' : 'plantas'}{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
                  te esperan
                </span>
              </>
            ) : (
              <>
                Todo en{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>orden</span>
              </>
            )}
          </h1>
        </div>

        <Link
          to="/add"
          className="btn btn--primary"
          aria-label="Añadir planta"
          style={{ flexShrink: 0 }}
        >
          + Nueva
        </Link>
      </header>

      {/* Plant list */}
      {plants.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__illustration" aria-hidden="true">🌱</span>
          <h2 className="empty-state__title">Aún no hay plantas</h2>
          <p className="empty-state__text">
            Añade tu primera planta y empieza a cuidarlas juntos.
          </p>
          <Link to="/add" className="btn btn--primary btn--lg">
            Añadir planta
          </Link>
        </div>
      ) : (
        <section aria-label="Tus plantas">
          <div className="plant-list">
            {plants.map((p) => (
              <PlantCard
                key={p.plant.id.value}
                plantWithStatus={p}
                onQuickWater={(id) => waterMutation.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <main className="page">
      <div className="page-header">
        <div>
          <div style={{ height: 14, width: 80, background: 'var(--clr-line)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 28, width: 200, background: 'var(--clr-line)', borderRadius: 4 }} />
        </div>
      </div>
      <div className="plant-list">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 100,
              background: 'var(--clr-cream-dark)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--clr-line)',
              opacity: 1 - i * 0.15,
            }}
          />
        ))}
      </div>
    </main>
  )
}
