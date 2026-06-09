import { createContext, useContext } from 'react'
import { BlobPlantRepository } from '@/infrastructure/blob/BlobPlantRepository'
import { AddPlant } from '@/core/plants/usecases/AddPlant'
import { GetPlants } from '@/core/plants/usecases/GetPlants'
import { WaterPlant } from '@/core/plants/usecases/WaterPlant'
import { GetWateringHistory } from '@/core/plants/usecases/GetWateringHistory'
import { IdentifyPlantFromImage } from '@/core/plants/usecases/IdentifyPlantFromImage'

// ─── Infrastructure adapters ─────────────────────────────────────────────────
const plantRepository = new BlobPlantRepository()

// ─── Use cases (composed with ports) ─────────────────────────────────────────
export interface Container {
  addPlant: AddPlant
  getPlants: GetPlants
  waterPlant: WaterPlant
  getWateringHistory: GetWateringHistory
  identifyPlant: IdentifyPlantFromImage
}

const container: Container = {
  addPlant: new AddPlant(plantRepository),
  getPlants: new GetPlants(plantRepository),
  waterPlant: new WaterPlant(plantRepository),
  getWateringHistory: new GetWateringHistory(plantRepository),
  // IdentifyPlantFromImage requires PlantIdentifier — injected lazily in Phase 3
  identifyPlant: null as unknown as IdentifyPlantFromImage,
}

const ContainerContext = createContext<Container>(container)

export function ContainerProvider({ children }: { children: React.ReactNode }) {
  return (
    <ContainerContext.Provider value={container}>
      {children}
    </ContainerContext.Provider>
  )
}

export function useContainer(): Container {
  return useContext(ContainerContext)
}
