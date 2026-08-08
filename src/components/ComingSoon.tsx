import { Link } from 'react-router-dom'

interface ComingSoonProps {
  title: string
  caption: string
}

export function ComingSoon({ title, caption }: ComingSoonProps) {
  return (
    <div className="stack">
      <h1 className="screen-title">{title}</h1>
      <p className="screen-caption">{caption}</p>
      <section className="card empty">
        <p>
          Este módulo llegará en una fase próxima del proyecto.
        </p>
        <Link className="btn btn--primary" to="/">
          Volver al menú
        </Link>
      </section>
    </div>
  )
}