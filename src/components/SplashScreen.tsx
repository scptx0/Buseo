import { useEffect, useState } from 'react'

import logoBuseo from '../../iconos/logo_buseo.png'

interface SplashScreenProps {
  onDone: () => void
}

const HOLD_MS = 1400
const FADE_MS = 400

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setClosing(true), HOLD_MS)
    const doneTimer = setTimeout(onDone, HOLD_MS + FADE_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className={`splash${closing ? ' splash--closing' : ''}`}>
      <img className="splash__logo" src={logoBuseo} alt="Buseo" />
    </div>
  )
}
