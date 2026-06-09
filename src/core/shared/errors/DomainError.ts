export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class PlantNotFoundError extends DomainError {
  constructor(plantId: string) {
    super(`Plant with id "${plantId}" not found`, 'PLANT_NOT_FOUND')
  }
}

export class InvalidWateringFrequencyError extends DomainError {
  constructor(days: number) {
    super(
      `Watering frequency must be between 1 and 365 days, got ${days}`,
      'INVALID_WATERING_FREQUENCY',
    )
  }
}
