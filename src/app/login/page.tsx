import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Bus, ArrowRight } from 'lucide-react'
import { lines } from '../../lib/mockData'
import { saveUserProfile } from '../../lib/storage'

export function LoginPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [lineId, setLineId] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !gender || !lineId) {
      setError('Completa todos los campos para continuar.')
      return
    }
    saveUserProfile({ name: name.trim(), gender, preferredLineId: lineId })
    navigate('/')
  }

  return (
    <div className="gate" style={{ minHeight: '100dvh' }}>
      <div className="gate__icon" aria-hidden>
        <Bus size={40} strokeWidth={1.5} />
      </div>
      <h1 className="gate__title">Bienvenido a Buseo</h1>
      <p className="gate__caption">
        Elige tu línea preferida y cuéntanos tu nombre para personalizar tu experiencia.
      </p>

      <form onSubmit={onSubmit} className="stack" style={{ width: '100%', maxWidth: 320 }}>
        <div className="field">
          <label className="field__label" htmlFor="name">
            Tu nombre
          </label>
          <input
            id="name"
            className="input"
            type="text"
            placeholder="Ej. Carlos"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            required
          />
        </div>

        <div className="field">
          <span className="field__label">Género</span>
          <div className="radio-grid">
            {[
              { value: 'hombre', label: 'Hombre' },
              { value: 'mujer', label: 'Mujer' },
              { value: 'na', label: 'Prefiero no decir' },
            ].map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={gender === opt.value}
                  onChange={() => {
                    setGender(opt.value)
                    setError('')
                  }}
                />
                <span>
                  {opt.label}
                  {gender === opt.value && <ArrowRight size={16} />}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="line">
            Línea preferida
          </label>
          <select
            id="line"
            className="select"
            value={lineId}
            onChange={(e) => {
              setLineId(e.target.value)
              setError('')
            }}
            required
          >
            <option value="" disabled>
              Selecciona tu línea
            </option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-center" style={{ color: '#c4a8ec', fontSize: '0.85rem', margin: 0 }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary">
          Comenzar
        </button>

        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            saveUserProfile({ name: 'Viajero', gender: 'na', preferredLineId: lines[0].id })
            navigate('/')
          }}
        >
          Continuar con Google
        </button>
      </form>

      <p className="gate__hint">Solo usamos estos datos para personalizar la app.</p>
    </div>
  )
}
