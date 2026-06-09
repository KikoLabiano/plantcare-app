import { PlantIdentificationResult, PlantIdentifier } from '../ports/PlantIdentifier'

export class IdentifyPlantFromImage {
  constructor(private readonly plantIdentifier: PlantIdentifier) {}

  async execute(imageBase64: string): Promise<PlantIdentificationResult[]> {
    const results = await this.plantIdentifier.identify(imageBase64)
    // Return top 3 results, sorted by confidence
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  }
}
