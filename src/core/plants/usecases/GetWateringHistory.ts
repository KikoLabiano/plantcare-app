import { WateringRecord } from '../domain/WateringRecord'
import { PlantRepository } from '../ports/PlantRepository'
import { PlantNotFoundError } from '@/core/shared/errors/DomainError'

export interface GetWateringHistoryResult {
  records: WateringRecord[]
  lastWateredAt: Date | null
  nextWateringAt: Date | null
}

export class GetWateringHistory {
  constructor(private readonly plantRepository: PlantRepository) {}

  async execute(plantId: string): Promise<GetWateringHistoryResult> {
    const plant = await this.plantRepository.findById(plantId)
    if (!plant) {
      throw new PlantNotFoundError(plantId)
    }

    const records = await this.plantRepository.findWateringRecords(plantId)

    // Sort descending — most recent first
    const sorted = [...records].sort(
      (a, b) => b.wateredAt.getTime() - a.wateredAt.getTime(),
    )

    const lastWateredAt = sorted[0]?.wateredAt ?? null
    const nextWateringAt = plant.nextWateringDate(lastWateredAt)

    return { records: sorted, lastWateredAt, nextWateringAt }
  }
}
