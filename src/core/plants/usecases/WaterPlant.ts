import { WateringRecord } from '../domain/WateringRecord'
import { PlantRepository } from '../ports/PlantRepository'
import { PlantNotFoundError } from '@/core/shared/errors/DomainError'

export interface WaterPlantInput {
  plantId: string
  wateredAt?: Date
  wateredBy?: string
  amountMl?: number
  notes?: string
}

export class WaterPlant {
  constructor(private readonly plantRepository: PlantRepository) {}

  async execute(input: WaterPlantInput): Promise<WateringRecord> {
    const plant = await this.plantRepository.findById(input.plantId)
    if (!plant) {
      throw new PlantNotFoundError(input.plantId)
    }

    const record = new WateringRecord({
      plantId: input.plantId,
      wateredAt: input.wateredAt ?? new Date(),
      wateredBy: input.wateredBy,
      amountMl: input.amountMl,
      notes: input.notes,
    })

    await this.plantRepository.saveWateringRecord(record)
    return record
  }
}
