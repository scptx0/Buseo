import { Link } from 'react-router-dom'
import { Bus, MapPin, AlertTriangle, Radio, MessageSquare } from 'lucide-react'

import { getUserName } from '../../lib/storage'

interface ModuleTile {
  to: string
  tone: string
  Icon: React.ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>
  title: string
}

const MODULES: ModuleTile[] = [
  { to: '/planear', tone: 'blue', Icon: Bus, title: 'Planear ruta' },
  { to: '/ruta-actual', tone: 'purple', Icon: MapPin, title: 'Tu ruta actual' },
  { to: '/reporte', tone: 'yellow', Icon: AlertTriangle, title: 'Reporte' },
  { to: '/buses', tone: 'ok', Icon: Radio, title: '¿Dónde están los buses?' },
  { to: '/canal', tone: 'celeste', Icon: MessageSquare, title: 'Canal' },
]

export function MenuPage() {
  const name = getUserName()
  return (
    <div className="metro-center">
      <div>
        <h1 className="screen-title">Hola{name ? ` ${name}` : ''}</h1>
        <p className="screen-caption">¿Hacia dónde viajas hoy?</p>
      </div>
      <nav className="metro-grid" aria-label="Módulos">
        {MODULES.map((m, i) => (
          <Link
            key={m.to}
            className={`metro-tile metro-tile--${m.tone} ${i === 0 ? 'metro-tile--wide' : ''}`}
            to={m.to}
          >
            <m.Icon className="metro-tile__icon" size={i === 0 ? 80 : 28} strokeWidth={1.5} />
            <span className="metro-tile__title">{m.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}