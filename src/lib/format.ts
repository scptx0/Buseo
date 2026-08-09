/** Formatea una fecha ISO como tiempo relativo corto: "Ahora", "Hace 5m", "Hace 3h". */
export function formatTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const min = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h}h`
  return d.toLocaleDateString()
}
