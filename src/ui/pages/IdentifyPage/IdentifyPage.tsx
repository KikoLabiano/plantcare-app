import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlantIdentification } from '@/ui/hooks/usePlantIdentification'
import { type PlantIdentificationResult } from '@/infrastructure/plantId/PlantIdService'
import styles from './IdentifyPage.module.css'

type Step = 'capture' | 'preview' | 'result'

const CONFIDENCE_THRESHOLD = 0.4

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const level = confidence >= 0.75 ? 'high' : confidence >= 0.5 ? 'medium' : 'low'
  const labels = { high: 'Alta confianza', medium: 'Confianza media', low: 'Baja confianza' }
  return (
    <span className={`${styles.badge} ${styles[`badge--${level}`]}`}>
      {labels[level]} · {pct}%
    </span>
  )
}

function LightLabel({ light }: { light: string }) {
  const map: Record<string, string> = {
    low: '🌑 Sombra',
    medium: '⛅ Indirecta',
    high: '🌤 Mucha luz',
    direct: '☀️ Sol directo',
  }
  return <>{map[light] ?? light}</>
}

function WaterLabel({ water }: { water: string }) {
  const map: Record<string, string> = { low: '🪣 Poco', medium: '💧 Moderado', high: '🌊 Abundante' }
  return <>{map[water] ?? water}</>
}

export function IdentifyPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('capture')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { status, result, error, identify, reset } = usePlantIdentification()

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    setStep('preview')
  }, [])

  const handleIdentify = useCallback(async () => {
    if (!file) return
    await identify(file)
    setStep('result')
  }, [file, identify])

  const handleRetry = useCallback(() => {
    reset()
    setStep('capture')
    setPreview(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [reset])

  const handleUseData = useCallback((data: PlantIdentificationResult) => {
    sessionStorage.setItem('plantcare_prefill', JSON.stringify(data))
    navigate('/add')
  }, [navigate])

  return (
    <main className={`page ${styles.page}`}>
      <header className="page-header">
        <div>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/add')}
            aria-label="Volver"
          >
            ← Volver
          </button>
          <h1 className="page-title">
            Identificar{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>planta</span>
          </h1>
          <p className="page-subtitle">Haz una foto para identificarla</p>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="plant-photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Step: Capture */}
      {step === 'capture' && (
        <div className={styles.captureArea}>
          <div
            className={styles.cameraButton}
            role="button"
            tabIndex={0}
            aria-label="Abrir cámara para fotografiar la planta"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <span className={styles.cameraIcon}>📷</span>
            <p className={styles.cameraLabel}>Toca para abrir la cámara</p>
            <p className={styles.cameraHint}>o selecciona una foto de tu galería</p>
          </div>

          <div className={styles.tips}>
            <h2 className={styles.tipsTitle}>💡 Consejos para mejores resultados</h2>
            <ul className={styles.tipsList}>
              <li>Enfoca las hojas o flores claramente</li>
              <li>Usa buena iluminación natural</li>
              <li>Evita fondos muy recargados</li>
              <li>Cuanto más cerca, mejor</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && preview && (
        <div className={styles.previewArea}>
          <div className={styles.previewImageWrap}>
            <img src={preview} alt="Foto de la planta" className={styles.previewImage} />
          </div>
          <div className={styles.previewActions}>
            <button
              id="btn-identify"
              className="btn btn--primary btn--full btn--lg"
              onClick={handleIdentify}
              disabled={status === 'identifying'}
            >
              {status === 'identifying' ? (
                <span className={styles.loadingRow}>
                  <span className={styles.spinner} aria-hidden="true" />
                  Identificando…
                </span>
              ) : (
                '🔍 Identificar esta planta'
              )}
            </button>
            <button
              className="btn btn--secondary btn--full"
              onClick={handleRetry}
              disabled={status === 'identifying'}
            >
              Repetir foto
            </button>
          </div>
        </div>
      )}

      {/* Step: Result (loading inline in preview, error or success here) */}
      {step === 'result' && (
        <div className={styles.resultArea}>
          {status === 'identifying' && (
            <div className={styles.loadingCard}>
              <div className={styles.spinnerLg} aria-label="Analizando imagen…" />
              <p className={styles.loadingText}>Analizando tu planta…</p>
              <p className={styles.loadingSubtext}>Esto puede tardar unos segundos</p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorCard}>
              <span className={styles.errorIcon}>🌿</span>
              <h2 className={styles.errorTitle}>No hemos podido identificarla</h2>
              <p className={styles.errorMsg}>{error}</p>
              <button className="btn btn--primary btn--full" onClick={handleRetry}>
                Intentar de nuevo
              </button>
            </div>
          )}

          {status === 'success' && result && (
            <>
              {preview && (
                <img
                  src={preview}
                  alt="Foto identificada"
                  className={styles.resultThumb}
                />
              )}

              <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <div>
                    <h2 className={styles.resultName}>{result.name}</h2>
                    <p className={styles.resultSpecies}>{result.species}</p>
                  </div>
                  <ConfidenceBadge confidence={result.confidence} />
                </div>

                {result.confidence < CONFIDENCE_THRESHOLD && (
                  <div className={styles.lowConfidenceWarning} role="alert">
                    ⚠️ La confianza es baja. Revisa los datos antes de guardarlos.
                  </div>
                )}

                <div className={styles.resultStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>💧 Riego</span>
                    <span className={styles.statValue}>Cada {result.wateringFrequencyDays} días</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>☀️ Luz</span>
                    <span className={styles.statValue}><LightLabel light={result.light} /></span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>🚿 Agua</span>
                    <span className={styles.statValue}><WaterLabel water={result.water} /></span>
                  </div>
                  {result.temperatureMin !== undefined && result.temperatureMax !== undefined && (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>🌡️ Temperatura</span>
                      <span className={styles.statValue}>{result.temperatureMin}–{result.temperatureMax}°C</span>
                    </div>
                  )}
                </div>

                {result.notes && (
                  <p className={styles.resultNotes}>{result.notes}</p>
                )}
              </div>

              <div className={styles.resultActions}>
                <button
                  id="btn-use-plant-data"
                  className="btn btn--primary btn--full btn--lg"
                  onClick={() => handleUseData(result)}
                >
                  ✅ Usar estos datos
                </button>
                <button className="btn btn--secondary btn--full" onClick={handleRetry}>
                  Repetir con otra foto
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}
