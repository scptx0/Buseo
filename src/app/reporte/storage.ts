const STORAGE_KEY = 'buseo:reports'

export function pushReport(report: Record<string, unknown>): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  const arr: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : []
  arr.push({ ...report, ts: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}
