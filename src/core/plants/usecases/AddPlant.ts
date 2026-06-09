import { Plant, PlantProps } from '../domain/Plant'
import { PlantRepository } from '../ports/PlantRepository'

export type AddPlantInput = Omit<PlantProps, 'id' | 'createdAt' | 'updatedAt'>

export class AddPlant {
  constructor(private readonly plantRepository: PlantRepository) {}

  async execute(input: AddPlantInput): Promise<Plant> {
    const plant = new Plant(input)
    await this.plantRepository.save(plant)
    return plant
  }
}
