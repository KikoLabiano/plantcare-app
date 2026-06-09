export interface PlantIdentificationResult {
  name: string
  species: string
  confidence: number // 0-1
  wateringFrequencyDays: number
  light: 'low' | 'medium' | 'high' | 'direct'
  water: 'low' | 'medium' | 'high'
  temperatureMin?: number
  temperatureMax?: number
  notes?: string
  commonNames: string[]
}

interface PlantIdSuggestion {
  id: number
  name: string
  probability: number
  similar_images?: Array<{ url: string }>
  details?: {
    common_names?: string[]
    watering?: { min?: number; max?: number; text?: string }
    best_light_condition?: string
    best_watering?: string
    best_soil_type?: string
    toxicity?: string
    description?: { value: string }
    synonyms?: string[]
    edible_parts?: string[]
    propagation_methods?: string[]
  }
}

interface PlantIdResponse {
  access_token: string
  model_version: string
  custom_id: string | null
  input: { images: string[]; datetime: string; latitude: null; longitude: null; similar_images: boolean }
  result: {
    is_plant: { probability: number; binary: boolean; threshold: number }
    classification: {
      suggestions: PlantIdSuggestion[]
    }
  }
  status: string
  sla_compliant_client: boolean
  sla_compliant_system: boolean
  created: number
  completed: number
}

function mapLight(lightText?: string): 'low' | 'medium' | 'high' | 'direct' {
  if (!lightText) return 'medium'
  const l = lightText.toLowerCase()
  if (l.includes('direct') || l.includes('full sun') || l.includes('sol direct')) return 'direct'
  if (l.includes('high') || l.includes('bright') || l.includes('much')) return 'high'
  if (l.includes('low') || l.includes('shade') || l.includes('sombra')) return 'low'
  return 'medium'
}

function mapWater(waterText?: string, wateringDays?: number): 'low' | 'medium' | 'high' {
  if (wateringDays !== undefined) {
    if (wateringDays >= 14) return 'low'
    if (wateringDays <= 5) return 'high'
    return 'medium'
  }
  if (!waterText) return 'medium'
  const w = waterText.toLowerCase()
  if (w.includes('low') || w.includes('poco') || w.includes('drought') || w.includes('minimal')) return 'low'
  if (w.includes('high') || w.includes('abundant') || w.includes('frequent') || w.includes('moist')) return 'high'
  return 'medium'
}

function estimateWateringDays(suggestion: PlantIdSuggestion): number {
  const wateringDetails = suggestion.details?.watering
  if (wateringDetails?.min && wateringDetails?.max) {
    return Math.round((wateringDetails.min + wateringDetails.max) / 2)
  }
  if (wateringDetails?.min) return wateringDetails.min
  if (wateringDetails?.max) return wateringDetails.max
  // Fallback from text hints
  const text = (wateringDetails?.text ?? '').toLowerCase()
  if (text.includes('daily') || text.includes('diario')) return 1
  if (text.includes('week') || text.includes('semana')) return 7
  if (text.includes('two weeks') || text.includes('quince')) return 14
  return 7 // sensible default
}

export async function identifyPlant(imageBase64: string): Promise<PlantIdentificationResult> {
  const apiKey = import.meta.env.VITE_PLANT_ID_API_KEY as string
  if (!apiKey) throw new Error('VITE_PLANT_ID_API_KEY no está configurada')

  const response = await fetch('https://api.plant.id/v3/identification', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: [imageBase64],
      classification_level: 'species',
      details: ['common_names', 'watering', 'best_light_condition', 'best_watering', 'description'],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Plant.id API error ${response.status}: ${err}`)
  }

  const data: PlantIdResponse = await response.json()

  if (!data.result?.classification?.suggestions?.length) {
    throw new Error('No se ha podido identificar la planta')
  }

  const top = data.result.classification.suggestions[0]
  const wateringDays = estimateWateringDays(top)

  return {
    name: top.details?.common_names?.[0] ?? top.name,
    species: top.name,
    confidence: top.probability,
    wateringFrequencyDays: wateringDays,
    light: mapLight(top.details?.best_light_condition),
    water: mapWater(top.details?.best_watering, wateringDays),
    commonNames: top.details?.common_names ?? [],
    notes: top.details?.description?.value?.slice(0, 300),
  }
}
