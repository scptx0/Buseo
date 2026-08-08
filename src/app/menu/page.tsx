import { Link } from 'react-router-dom'

import { getUserName } from '../../lib/storage'
import { BusIcon, MapIcon, AlertIcon, PinIcon, FeedIcon } from './MenuIcons'

interface ModuleTile {
  to: string
  tone: string
  Icon: React.ComponentType<{ className?: string }>
  title: string
}

const MODULES: ModuleTile[] = [
  { to: '/planear', tone: 'blue', Icon: BusIcon, title: 'Planear ruta' },
  { to: '/ruta-actual', tone: 'purple', Icon: MapIcon, title: 'Tu ruta actual' },
  { to: '/reporte', tone: 'yellow', Icon: AlertIcon, title: 'Reporte' },
  { to: '/buses', tone: 'ok', Icon: PinIcon, title: '¿Dónde están los buses?' },
  { to: '/canal', tone: 'celeste', Icon: FeedIcon, title: 'Canal' },
]

export function MenuPage() {
  return (
    <div className="metro-center">
      <div>
        <h1 className="screen-title">Hola {getUserName()}</h1>
        <p className="screen-caption">¿Hacia dónde viajas hoy?</p>
      </div>
      <nav className="metro-grid" aria-label="Módulos">
        {MODULES.map((m, i) => (
          <Link
            key={m.to}
            className={`metro-tile metro-tile--${m.tone} ${i === 0 ? 'metro-tile--wide' : ''}`}
            to={m.to}
          >
            <m.Icon className="metro-tile__icon" />
            <span className="metro-tile__title">{m.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}