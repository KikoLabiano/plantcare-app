import { UniqueId } from '@/core/shared/domain/UniqueId'

export interface WateringRecordProps {
  id?: string
  plantId: string
  wateredAt: Date
  wateredBy?: string
  amountMl?: number
  notes?: string
}

export class WateringRecord {
  readonly id: UniqueId
  readonly plantId: string
  readonly wateredAt: Date
  readonly wateredBy?: string
  readonly amountMl?: number
  readonly notes?: string

  constructor(props: WateringRecordProps) {
    this.id = new UniqueId(props.id)
    this.plantId = props.plantId
    this.wateredAt = props.wateredAt
    this.wateredBy = props.wateredBy
    this.amountMl = props.amountMl
    this.notes = props.notes
  }

  toJSON() {
    return {
      id: this.id.value,
      plantId: this.plantId,
      wateredAt: this.wateredAt.toISOString(),
      wateredBy: this.wateredBy,
      amountMl: this.amountMl,
      notes: this.notes,
    }
  }

  static fromJSON(raw: ReturnType<WateringRecord['toJSON']>): WateringRecord {
    return new WateringRecord({
      id: raw.id,
      plantId: raw.plantId,
      wateredAt: new Date(raw.wateredAt),
      wateredBy: raw.wateredBy,
      amountMl: raw.amountMl,
      notes: raw.notes,
    })
  }
}
