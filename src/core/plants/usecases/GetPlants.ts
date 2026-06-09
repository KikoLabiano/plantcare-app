import { Plant, PlantWithStatus } from '../domain/Plant'
import { PlantRepository } from '../ports/PlantRepository'

export interface GetPlantsResult {
  plantsWithStatus: PlantWithStatus[]
}

export class GetPlants {
  constructor(private readonly plantRepository: PlantRepository) {}

  async execute(): Promise<GetPlantsResult> {
    const plants = await this.plantRepository.findAll()

    const plantsWithStatus = await Promise.all(
      plants.map(async (plant) => {
        const lastRecord = await this.plantRepository.findLastWateringRecord(plant.id.value)
        const lastWateredAt = lastRecord?.wateredAt ?? null
        return {
          plant,
          lastWateredAt,
          nextWateringAt: plant.nextWateringDate(lastWateredAt),
          status: plant.wateringStatus(lastWateredAt),
        }
      }),
    )

    // Sort: overdue first, then due-today, due-soon, ok
    const statusOrder: Record<Plant['wateringStatus'] extends (...args: never[]) => infer R ? R : never, number> = {
      overdue: 0,
      'due-today': 1,
      'due-soon': 2,
      ok: 3,
    }

    plantsWithStatus.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

    return { plantsWithStatus }
  }
}
