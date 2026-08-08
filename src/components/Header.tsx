import { useLocation, useNavigate } from 'react-router-dom'
import { useHeaderTitle } from './HeaderTitleContext'

const TITLES: Array<{ match: string; title: string }> = [
  { match: '/planear', title: 'Planear ruta' },
  { match: '/ruta-actual', title: 'Tu ruta actual' },
  { match: '/reporte', title: 'Reporte' },
  { match: '/buses', title: '¿Dónde están los buses?' },
  { match: '/canal', title: 'Canal' },
]

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { title: dynamicTitle } = useHeaderTitle()
  if (pathname === '/') return null
  const conf = TITLES.find((t) => pathname.startsWith(t.match))

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__back"
        aria-label="Volver"
        onClick={() => navigate(-1)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="topbar__mark">{dynamicTitle ?? conf?.title ?? 'Buseo'}</span>
    </header>
  )
}