import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useContainer } from '@/di/container'
import styles from './AddPlantPage.module.css'

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  species: z.string().optional(),
  nickname: z.string().optional(),
  wateringFrequencyDays: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 día')
    .max(365, 'Máximo 365 días'),
  light: z.enum(['low', 'medium', 'high', 'direct']).optional(),
  water: z.enum(['low', 'medium', 'high']).optional(),
  temperatureMin: z.coerce.number().optional(),
  temperatureMax: z.coerce.number().optional(),
  careNotes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const LIGHT_OPTIONS = [
  { value: 'low', label: '🌑 Sombra' },
  { value: 'medium', label: '⛅ Indirecta' },
  { value: 'high', label: '🌤 Mucha' },
  { value: 'direct', label: '☀️ Sol directo' },
]

const WATER_OPTIONS = [
  { value: 'low', label: '🪣 Poco' },
  { value: 'medium', label: '💧 Moderado' },
  { value: 'high', label: '🌊 Abundante' },
]

export function AddPlantPage() {
  const { addPlant } = useContainer()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [aiPrefilled, setAiPrefilled] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { wateringFrequencyDays: 7 },
  })

  // Read prefill from IdentifyPage via sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('plantcare_prefill')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.name) setValue('name', data.name)
      if (data.species) setValue('species', data.species)
      if (data.wateringFrequencyDays) setValue('wateringFrequencyDays', data.wateringFrequencyDays)
      if (data.light) setValue('light', data.light)
      if (data.water) setValue('water', data.water)
      if (data.temperatureMin) setValue('temperatureMin', data.temperatureMin)
      if (data.temperatureMax) setValue('temperatureMax', data.temperatureMax)
      if (data.notes) setValue('careNotes', data.notes)
      setAiPrefilled(true)
      sessionStorage.removeItem('plantcare_prefill')
    } catch {
      // ignore malformed data
    }
  }, [setValue])

  const selectedLight = watch('light')
  const selectedWater = watch('water')

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      addPlant.execute({
        name: values.name,
        species: values.species,
        nickname: values.nickname,
        wateringFrequencyDays: values.wateringFrequencyDays,
        careInfo: values.light || values.water
          ? {
              light: values.light ?? 'medium',
              water: values.water ?? 'medium',
              temperatureMin: values.temperatureMin,
              temperatureMax: values.temperatureMax,
              notes: values.careNotes,
            }
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      navigate('/')
    },
  })

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            Nueva{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>planta</span>
          </h1>
          <p className="page-subtitle">Cuéntame sobre ella</p>
        </div>
      </header>

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        noValidate
        className={styles.form}
      >
        {/* AI prefill banner */}
        {aiPrefilled && (
          <div className={styles.aiBanner} role="status">
            <span>✨</span>
            <div>
              <p className={styles.aiBannerTitle}>Datos rellenados con IA</p>
              <p className={styles.aiBannerText}>Revisa y ajusta lo que necesites antes de guardar</p>
            </div>
          </div>
        )}

        {/* Identify by camera CTA */}
        <div className={styles.cameraCta}>
          <span aria-hidden="true">📷</span>
          <div>
            <p className={styles.cameraCtaTitle}>¿No sabes qué planta es?</p>
            <p className={styles.cameraCtaText}>
              Haz una foto y la identificamos automáticamente
            </p>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => navigate('/identify')}
            style={{ flexShrink: 0 }}
          >
            Usar cámara
          </button>
        </div>

        <div className="divider" />

        {/* Basic info */}
        <fieldset className={styles.fieldset}>
          <legend className="section-label">Información básica</legend>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-name">Nombre *</label>
            <input
              id="plant-name"
              className="form-input"
              placeholder="Monstera, Ficus…"
              {...register('name')}
            />
            {errors.name && <span className="form-error" role="alert">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-species">Especie</label>
            <input
              id="plant-species"
              className="form-input"
              placeholder="Monstera deliciosa"
              {...register('species')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-nickname">Apodo</label>
            <input
              id="plant-nickname"
              className="form-input"
              placeholder="La grande del salón"
              {...register('nickname')}
            />
          </div>
        </fieldset>

        {/* Watering frequency */}
        <fieldset className={styles.fieldset}>
          <legend className="section-label">Riego</legend>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-frequency">
              Cada cuántos días
            </label>
            <input
              id="plant-frequency"
              type="number"
              min={1}
              max={365}
              className="form-input"
              {...register('wateringFrequencyDays')}
            />
            {errors.wateringFrequencyDays && (
              <span className="form-error" role="alert">
                {errors.wateringFrequencyDays.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <span className="form-label" id="water-label">Cantidad de agua</span>
            <div className="pill-group" role="group" aria-labelledby="water-label">
              {WATER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`pill-option ${selectedWater === value ? 'selected' : ''}`}
                  onClick={() => setValue('water', value as FormValues['water'])}
                  aria-pressed={selectedWater === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Care info */}
        <fieldset className={styles.fieldset}>
          <legend className="section-label">Cuidados (opcional)</legend>

          <div className="form-group">
            <span className="form-label" id="light-label">Necesidad de luz</span>
            <div className="pill-group" role="group" aria-labelledby="light-label">
              {LIGHT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`pill-option ${selectedLight === value ? 'selected' : ''}`}
                  onClick={() => setValue('light', value as FormValues['light'])}
                  aria-pressed={selectedLight === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="plant-notes">Notas de cuidado</label>
            <textarea
              id="plant-notes"
              className="form-input"
              placeholder="Evitar luz solar directa, regar cuando la tierra esté seca…"
              rows={3}
              style={{ resize: 'vertical' }}
              {...register('careNotes')}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          className="btn btn--primary btn--full btn--lg"
          disabled={mutation.isPending}
          id="btn-add-plant"
        >
          {mutation.isPending ? 'Guardando…' : 'Añadir planta'}
        </button>

        {mutation.isError && (
          <p className="form-error text-center" role="alert">
            Error al guardar la planta. Inténtalo de nuevo.
          </p>
        )}
      </form>
    </main>
  )
}
