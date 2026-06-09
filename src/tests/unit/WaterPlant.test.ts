import { describe, it, expect, vi } from 'vitest'
import { WaterPlant } from '@/core/plants/usecases/WaterPlant'
import { PlantNotFoundError } from '@/core/shared/errors/DomainError'
import type { PlantRepository } from '@/core/plants/ports/PlantRepository'
import { Plant } from '@/core/plants/domain/Plant'
import { WateringRecord } from '@/core/plants/domain/WateringRecord'

function makeRepo(overrides: Partial<PlantRepository> = {}): PlantRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findWateringRecords: vi.fn(),
    findLastWateringRecord: vi.fn(),
    saveWateringRecord: vi.fn(),
    ...overrides,
  }
}

describe('WaterPlant use case', () => {
  const plant = new Plant({ name: 'Cactus', wateringFrequencyDays: 14 })

  it('saves a watering record for an existing plant', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(plant) })
    const useCase = new WaterPlant(repo)

    const record = await useCase.execute({ plantId: plant.id.value })

    expect(record).toBeInstanceOf(WateringRecord)
    expect(record.plantId).toBe(plant.id.value)
    expect(repo.saveWateringRecord).toHaveBeenCalledWith(record)
  })

  it('defaults wateredAt to now when not provided', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(plant) })
    const before = new Date()
    const record = await new WaterPlant(repo).execute({ plantId: plant.id.value })
    const after = new Date()

    expect(record.wateredAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(record.wateredAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('throws PlantNotFoundError for unknown plantId', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new WaterPlant(repo)

    await expect(useCase.execute({ plantId: 'unknown' })).rejects.toThrow(
      PlantNotFoundError,
    )
  })

  it('saves notes and amount if provided', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(plant) })
    const record = await new WaterPlant(repo).execute({
      plantId: plant.id.value,
      notes: 'Tierra muy seca',
      amountMl: 300,
      wateredBy: 'kikol',
    })

    expect(record.notes).toBe('Tierra muy seca')
    expect(record.amountMl).toBe(300)
    expect(record.wateredBy).toBe('kikol')
  })
})
