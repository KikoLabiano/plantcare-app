import { describe, it, expect } from 'vitest'
import { Plant } from '@/core/plants/domain/Plant'
import { WateringFrequency } from '@/core/plants/domain/PlantCareInfo'
import { InvalidWateringFrequencyError } from '@/core/shared/errors/DomainError'

describe('WateringFrequency', () => {
  it('creates a valid frequency', () => {
    const freq = new WateringFrequency(7)
    expect(freq.days).toBe(7)
  })

  it('throws for 0 days', () => {
    expect(() => new WateringFrequency(0)).toThrow(InvalidWateringFrequencyError)
  })

  it('throws for 366 days', () => {
    expect(() => new WateringFrequency(366)).toThrow(InvalidWateringFrequencyError)
  })

  it('rounds fractional days', () => {
    expect(new WateringFrequency(7.9).days).toBe(8)
  })

  it('calculates next watering date correctly', () => {
    const freq = new WateringFrequency(7)
    const last = new Date('2025-06-01')
    const next = freq.nextWateringDate(last)
    expect(next.toISOString().split('T')[0]).toBe('2025-06-08')
  })
})

describe('Plant', () => {
  const basePlant = () =>
    new Plant({ name: 'Monstera', wateringFrequencyDays: 7 })

  it('generates an id if none provided', () => {
    const plant = basePlant()
    expect(plant.id.value).toBeTruthy()
    expect(plant.id.value).toHaveLength(36)
  })

  it('displayName returns nickname when set', () => {
    const plant = new Plant({ name: 'Monstera', wateringFrequencyDays: 7, nickname: 'La grande' })
    expect(plant.displayName()).toBe('La grande')
  })

  it('displayName falls back to name', () => {
    expect(basePlant().displayName()).toBe('Monstera')
  })

  describe('wateringStatus', () => {
    it('returns overdue if never watered', () => {
      expect(basePlant().wateringStatus(null)).toBe('overdue')
    })

    it('returns ok when watered recently', () => {
      const today = new Date()
      const status = basePlant().wateringStatus(today)
      expect(status).toBe('ok')
    })

    it('returns due-today when next date is today', () => {
      const last = new Date()
      last.setDate(last.getDate() - 7)
      expect(basePlant().wateringStatus(last)).toBe('due-today')
    })

    it('returns overdue when overdue by 1 day', () => {
      const last = new Date()
      last.setDate(last.getDate() - 8)
      expect(basePlant().wateringStatus(last)).toBe('overdue')
    })

    it('returns due-soon when 2 days away', () => {
      const last = new Date()
      last.setDate(last.getDate() - 5)
      expect(basePlant().wateringStatus(last)).toBe('due-soon')
    })
  })

  it('serializes and deserializes correctly', () => {
    const plant = new Plant({
      name: 'Ficus',
      species: 'Ficus lyrata',
      wateringFrequencyDays: 10,
      careInfo: { light: 'high', water: 'medium' },
    })
    const restored = Plant.fromJSON(plant.toJSON())
    expect(restored.name).toBe(plant.name)
    expect(restored.id.value).toBe(plant.id.value)
    expect(restored.wateringFrequency.days).toBe(10)
    expect(restored.careInfo?.light).toBe('high')
  })
})
