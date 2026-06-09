import { PlantRepository } from '../ports/PlantRepository'

export class DeletePlant {
  constructor(private plantRepository: PlantRepository) {}

  async execute(plantId: string): Promise<void> {
    await this.plantRepository.delete(plantId)
  }
}
