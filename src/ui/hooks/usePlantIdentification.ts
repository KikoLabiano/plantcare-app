import { useState, useCallback } from 'react'
import { identifyPlant, type PlantIdentificationResult } from '@/infrastructure/plantId/PlantIdService'

type IdentifyStatus = 'idle' | 'identifying' | 'success' | 'error'

export function usePlantIdentification() {
  const [status, setStatus] = useState<IdentifyStatus>('idle')
  const [result, setResult] = useState<PlantIdentificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const identify = useCallback(async (file: File) => {
    setStatus('identifying')
    setError(null)
    setResult(null)

    try {
      const base64 = await fileToBase64(file)
      const data = await identifyPlant(base64)
      setResult(data)
      setStatus('success')
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setStatus('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, identify, reset }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Plant.id expects just the base64 data, not the data URI prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
