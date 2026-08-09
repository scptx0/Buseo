import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { lines } from '../../lib/mockData'
import { saveUserProfile } from '../../lib/storage'
import { loginOrRegister, setUserUUID } from '../../lib/supabase/api'
import { GoogleIcon } from '../../components/GoogleIcon'

const GENDER_OPTIONS = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'na', label: 'Prefiero no decir' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [googleNote, setGoogleNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !gender) {
      setError('Completa todos los campos para continuar.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await loginOrRegister(username.trim(), gender)
      if (!res.ok || !res.id) {
        setError(res.message ?? 'No pudimos iniciar sesión.')
        return
      }
      saveUserProfile({
        name: res.username ?? username.trim(),
        gender: res.gender ?? gender,
        preferredLineId: res.preferredLineId ?? lines[0].id,
      })
      setUserUUID(res.id)
      navigate('/')
    } catch {
      setError('No pudimos conectar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gate" style={{ minHeight: '100dvh' }}>
      <h1 className="gate__title">¿Listo para busear?</h1>
      <p className="gate__caption">Cuéntanos quién eres para empezar.</p>

      <form onSubmit={onSubmit} className="stack" style={{ width: '100%', maxWidth: 320 }}>
        <div className="field">
          <label className="field__label" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            className="input gate-input"
            type="text"
            autoComplete="username"
            placeholder="Ej. carlos_mtz"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="gender">
            Género
          </label>
          <select
            id="gender"
            className="select gate-input"
            value={gender}
            onChange={(e) => {
              setGender(e.target.value)
              setError('')
            }}
            required
          >
            <option value="" disabled>
              Selecciona tu género
            </option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-center" style={{ color: '#c4a8ec', fontSize: '0.85rem', margin: 0 }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary gate-btn" disabled={loading}>
          {loading ? 'Ingresando…' : 'Comenzar'}
        </button>

        <button
          type="button"
          className="btn btn--ghost gate-btn"
          onClick={() => setGoogleNote('Aún no implementado')}
        >
          <GoogleIcon size={18} />
          Continuar con Google
        </button>
        {googleNote && (
          <p className="text-center" style={{ color: '#555', fontSize: '0.8rem', margin: 0 }}>
            {googleNote}
          </p>
        )}
      </form>
    </div>
  )
}
