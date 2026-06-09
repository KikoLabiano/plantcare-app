import { Plant } from '../domain/Plant'
import { WateringRecord } from '../domain/WateringRecord'

export interface PlantRepository {
  findAll(): Promise<Plant[]>
  findById(id: string): Promise<Plant | null>
  save(plant: Plant): Promise<void>
  update(plant: Plant): Promise<void>
  delete(id: string): Promise<void>

  findWateringRecords(plantId: string): Promise<WateringRecord[]>
  findLastWateringRecord(plantId: string): Promise<WateringRecord | null>
  saveWateringRecord(record: WateringRecord): Promise<void>
}
