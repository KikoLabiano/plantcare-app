import { Plant } from '@/core/plants/domain/Plant'
import { WateringRecord } from '@/core/plants/domain/WateringRecord'
import { PlantRepository } from '@/core/plants/ports/PlantRepository'

// ─── JSON data shape stored in Vercel Blob ──────────────────────────────────
interface BlobData {
  plants: ReturnType<Plant['toJSON']>[]
  wateringRecords: ReturnType<WateringRecord['toJSON']>[]
}

const BLOB_KEY = 'plantcare-data.json'
const API_BASE = '/api'

// ─── BlobPlantRepository ─────────────────────────────────────────────────────
// Reads/writes all data to a single JSON file via our Vercel API routes.
// This keeps the Blob SDK (and its secrets) exclusively on the server.
export class BlobPlantRepository implements PlantRepository {
  private async fetchData(): Promise<BlobData> {
    const res = await fetch(`${API_BASE}/data`, {
      headers: {
        'x-home-token': import.meta.env.VITE_HOME_PIN ?? '1234'
      }
    })
    if (!res.ok) throw new Error('Failed to fetch plant data')
    return res.json() as Promise<BlobData>
  }

  private async putData(data: BlobData): Promise<void> {
    const res = await fetch(`${API_BASE}/data`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-home-token': import.meta.env.VITE_HOME_PIN ?? '1234'
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save plant data')
  }

  async findAll(): Promise<Plant[]> {
    const data = await this.fetchData()
    return data.plants.map(Plant.fromJSON)
  }

  async findById(id: string): Promise<Plant | null> {
    const data = await this.fetchData()
    const raw = data.plants.find((p) => p.id === id)
    return raw ? Plant.fromJSON(raw) : null
  }

  async save(plant: Plant): Promise<void> {
    const data = await this.fetchData()
    data.plants.push(plant.toJSON())
    await this.putData(data)
  }

  async update(plant: Plant): Promise<void> {
    const data = await this.fetchData()
    const idx = data.plants.findIndex((p) => p.id === plant.id.value)
    if (idx === -1) throw new Error(`Plant ${plant.id.value} not found`)
    data.plants[idx] = { ...plant.toJSON(), updatedAt: new Date().toISOString() }
    await this.putData(data)
  }

  async delete(id: string): Promise<void> {
    const data = await this.fetchData()
    data.plants = data.plants.filter((p) => p.id !== id)
    data.wateringRecords = data.wateringRecords.filter((r) => r.plantId !== id)
    await this.putData(data)
  }

  async findWateringRecords(plantId: string): Promise<WateringRecord[]> {
    const data = await this.fetchData()
    return data.wateringRecords
      .filter((r) => r.plantId === plantId)
      .map(WateringRecord.fromJSON)
  }

  async findLastWateringRecord(plantId: string): Promise<WateringRecord | null> {
    const records = await this.findWateringRecords(plantId)
    if (records.length === 0) return null
    return records.reduce((latest, r) =>
      r.wateredAt > latest.wateredAt ? r : latest,
    )
  }

  async saveWateringRecord(record: WateringRecord): Promise<void> {
    const data = await this.fetchData()
    data.wateringRecords.push(record.toJSON())
    await this.putData(data)
  }
}

export { BLOB_KEY }
