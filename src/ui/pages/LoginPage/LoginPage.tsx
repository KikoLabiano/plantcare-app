import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/ui/stores/authStore'
import styles from './LoginPage.module.css'

const PIN_LENGTH = 4

export function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleKey = (digit: string) => {
    setError(false)
    if (pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      const ok = login(next)
      if (ok) {
        navigate('/', { replace: true })
      } else {
        setTimeout(() => {
          setPin('')
          setError(true)
        }, 300)
      }
    }
  }

  const handleDelete = () => {
    setError(false)
    setPin((p) => p.slice(0, -1))
  }

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','→']

  return (
    <main className="login-page">
      <div className="login-page__mark">
        <div className="login-page__logo" aria-hidden="true">🌿</div>
        <h1 className="login-page__wordmark">Plantcare</h1>
        <p className="login-page__tagline">Tus plantas en un solo lugar</p>
      </div>

      <div className="pin-input-wrapper">
        {/* PIN dots */}
        <div className="pin-dots" aria-label={`PIN: ${pin.length} de ${PIN_LENGTH} dígitos`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? styles.shake : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className={styles.errorMsg} role="alert">PIN incorrecto. Inténtalo de nuevo.</p>
        )}

        {/* Keypad */}
        <div className="pin-keypad" role="group" aria-label="Teclado de PIN">
          {keys.map((key) => (
            <button
              key={key}
              className="pin-key"
              onClick={() => key === '⌫' ? handleDelete() : key !== '→' ? handleKey(key) : undefined}
              aria-label={key === '⌫' ? 'Borrar' : key === '→' ? '' : key}
              disabled={key === '→'}
              style={key === '→' ? { opacity: 0 } : undefined}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
