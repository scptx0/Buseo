import { createContext, useContext, type ReactNode } from 'react'

import { useGeolocation, type GeoPosition, type GeoState, type GeoStatus } from '../../hooks/useGeolocation'

const GeoContext = createContext<GeoState>({ status: 'prompt', position: null })

export function useGeo(): GeoState {
  return useContext(GeoContext)
}

const COPY: Record<Exclude<GeoStatus, 'granted'>, { title: string; caption: string }> = {
  prompt: {
    title: 'Activa tu ubicación para continuar',
    caption:
      'Necesitamos saber dónde estás para recomendarte la estación más cercana. Actívala para seguir.',
  },
  denied: {
    title: 'Ubicación desactivada',
    caption:
      'Se bloqueó el acceso a tu ubicación. Actívala en los ajustes del sitio y pulsa el botón para reintentar.',
  },
  unsupported: {
    title: 'No podemos usar tu ubicación',
    caption: 'Este dispositivo no tiene geolocalización, así que no podemos orientarte por ahora.',
  },
}

interface LocationGateProps {
  children: ReactNode
}

export function LocationGate({ children }: LocationGateProps) {
  const { state, retry } = useGeolocation()

  if (state.status === 'granted' && state.position) {
    return <GeoContext.Provider value={state}>{children}</GeoContext.Provider>
  }

  const copy = COPY[state.status as Exclude<GeoStatus, 'granted'>]

  return (
    <div className="gate">
      <div className="gate__icon" aria-hidden>
        <span className="gate__dot" />
      </div>
      <h1 className="gate__title">{copy.title}</h1>
      <p className="gate__caption">{copy.caption}</p>
      {state.status !== 'unsupported' && (
        <button type="button" className="btn btn--primary" onClick={retry}>
          Intentar de nuevo
        </button>
      )}
      <p className="gate__hint">Tu ubicación se usa solo para la app y nunca se comparte sin permiso.</p>
    </div>
  )
}

export type { GeoPosition }