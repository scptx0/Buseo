import { Link } from 'react-router-dom'

import { getUserName } from '../../lib/storage'
import logoBuseo from '../../../iconos/logo_buseo.png'
import iconoPlanear from '../../../iconos/icono_metrop.png'
import iconoTuRuta from '../../../iconos/icono_tu_ruta.png'
import iconoBuses from '../../../iconos/icono_localizar_buss.png'
import iconoReporte from '../../../iconos/icono_aviso.png'
import iconoCanal from '../../../iconos/icono_canal.png'

const LEFT_TILES = [
  { to: '/planear', img: iconoPlanear, label: 'Planear ruta', cls: 'home-tile--planear' },
  { to: '/ruta-actual', img: iconoTuRuta, label: 'Tu ruta actual', cls: 'home-tile--ruta' },
]

const RIGHT_TILES = [
  { to: '/buses', img: iconoBuses, label: '¿Dónde están los buses?', cls: 'home-tile--buses' },
  { to: '/reporte', img: iconoReporte, label: 'Reporte', cls: 'home-tile--reporte' },
  { to: '/canal', img: iconoCanal, label: 'Canal', cls: 'home-tile--canal' },
]

export function MenuPage() {
  const name = getUserName()
  return (
    <div>
      <header className="home-header">
        <img className="home-logo" src={logoBuseo} alt="Buseo" />
        <span className="home-brand">Buseo</span>
        <span className="home-greeting">
          Hola{name ? `, ${name}` : ''}
        </span>
      </header>

      <nav className="home-grid" aria-label="Módulos">
        {LEFT_TILES.map((t) => (
          <Link key={t.to} className={`home-tile ${t.cls}`} to={t.to}>
            <img className="home-tile__img" src={t.img} alt={t.label} />
            <span className="home-tile__label">{t.label}</span>
          </Link>
        ))}
        {RIGHT_TILES.map((t) => (
          <Link key={t.to} className={`home-tile ${t.cls}`} to={t.to}>
            <img className="home-tile__img" src={t.img} alt={t.label} />
            <span className="home-tile__label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
