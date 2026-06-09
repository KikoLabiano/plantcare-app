import { PlantCareInfoProps } from '../domain/PlantCareInfo'

export interface PlantIdentificationResult {
  name: string
  species: string
  commonNames: string[]
  confidence: number
  careInfo: PlantCareInfoProps
  description?: string
}

export interface PlantIdentifier {
  identify(imageBase64: string): Promise<PlantIdentificationResult[]>
}
