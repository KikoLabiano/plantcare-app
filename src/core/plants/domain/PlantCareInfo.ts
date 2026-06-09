import { InvalidWateringFrequencyError } from '@/core/shared/errors/DomainError'

export type LightRequirement = 'low' | 'medium' | 'high' | 'direct'
export type WaterAmount = 'low' | 'medium' | 'high'

export interface PlantCareInfoProps {
  light: LightRequirement
  water: WaterAmount
  temperatureMin?: number
  temperatureMax?: number
  notes?: string
}

export class PlantCareInfo {
  readonly light: LightRequirement
  readonly water: WaterAmount
  readonly temperatureMin?: number
  readonly temperatureMax?: number
  readonly notes?: string

  constructor(props: PlantCareInfoProps) {
    this.light = props.light
    this.water = props.water
    this.temperatureMin = props.temperatureMin
    this.temperatureMax = props.temperatureMax
    this.notes = props.notes
  }

  toJSON(): PlantCareInfoProps {
    return {
      light: this.light,
      water: this.water,
      temperatureMin: this.temperatureMin,
      temperatureMax: this.temperatureMax,
      notes: this.notes,
    }
  }
}

export class WateringFrequency {
  private readonly _days: number

  constructor(days: number) {
    if (days < 1 || days > 365) {
      throw new InvalidWateringFrequencyError(days)
    }
    this._days = Math.round(days)
  }

  get days(): number {
    return this._days
  }

  nextWateringDate(lastWateredAt: Date): Date {
    const next = new Date(lastWateredAt)
    next.setDate(next.getDate() + this._days)
    return next
  }

  toString(): string {
    return `Every ${this._days} day${this._days === 1 ? '' : 's'}`
  }
}
