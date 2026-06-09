import { UniqueId } from '@/core/shared/domain/UniqueId'
import { PlantCareInfo, PlantCareInfoProps, WateringFrequency } from './PlantCareInfo'
import { WateringRecord } from './WateringRecord'

export type WateringStatus = 'overdue' | 'due-today' | 'due-soon' | 'ok'

export interface PlantProps {
  id?: string
  name: string
  species?: string
  nickname?: string
  photoUrl?: string
  wateringFrequencyDays: number
  careInfo?: PlantCareInfoProps
  acquiredAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export class Plant {
  readonly id: UniqueId
  readonly name: string
  readonly species?: string
  readonly nickname?: string
  readonly photoUrl?: string
  readonly wateringFrequency: WateringFrequency
  readonly careInfo?: PlantCareInfo
  readonly acquiredAt?: Date
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(props: PlantProps) {
    this.id = new UniqueId(props.id)
    this.name = props.name
    this.species = props.species
    this.nickname = props.nickname
    this.photoUrl = props.photoUrl
    this.wateringFrequency = new WateringFrequency(props.wateringFrequencyDays)
    this.careInfo = props.careInfo ? new PlantCareInfo(props.careInfo) : undefined
    this.acquiredAt = props.acquiredAt
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  displayName(): string {
    return this.nickname ?? this.name
  }

  nextWateringDate(lastWateredAt: Date | null): Date | null {
    if (!lastWateredAt) return null
    return this.wateringFrequency.nextWateringDate(lastWateredAt)
  }

  wateringStatus(lastWateredAt: Date | null): WateringStatus {
    if (!lastWateredAt) return 'overdue'

    const next = this.wateringFrequency.nextWateringDate(lastWateredAt)
    const now = new Date()
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'due-today'
    if (diffDays <= 2) return 'due-soon'
    return 'ok'
  }

  withLastWatering(record: WateringRecord): PlantWithStatus {
    return {
      plant: this,
      lastWateredAt: record.wateredAt,
      nextWateringAt: this.nextWateringDate(record.wateredAt),
      status: this.wateringStatus(record.wateredAt),
    }
  }

  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      species: this.species,
      nickname: this.nickname,
      photoUrl: this.photoUrl,
      wateringFrequencyDays: this.wateringFrequency.days,
      careInfo: this.careInfo?.toJSON(),
      acquiredAt: this.acquiredAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  static fromJSON(raw: ReturnType<Plant['toJSON']>): Plant {
    return new Plant({
      id: raw.id,
      name: raw.name,
      species: raw.species,
      nickname: raw.nickname,
      photoUrl: raw.photoUrl,
      wateringFrequencyDays: raw.wateringFrequencyDays,
      careInfo: raw.careInfo,
      acquiredAt: raw.acquiredAt ? new Date(raw.acquiredAt) : undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    })
  }
}

export interface PlantWithStatus {
  plant: Plant
  lastWateredAt: Date | null
  nextWateringAt: Date | null
  status: WateringStatus
}
