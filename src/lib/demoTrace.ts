import type { PathEntry } from './routePath'

export interface DemoPos {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
  /** segundos restantes al destino (para notificación) */
  remainingSec: number
}

export interface DemoStop {
  stop: () => void
}

const JITTER_DEG = 0.000018

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function readRate(): number {
  if (typeof window === 'undefined') return 360
  const raw = window.localStorage.getItem('buseo:demoRate')
  const n = raw ? Number(raw) : 360
  return Number.isFinite(n) && n > 0 ? n : 360
}

export function startDemoTrace(
  path: PathEntry[],
  durationsSec: number[],
  onPos: (p: DemoPos) => void,
): DemoStop | null {
  if (path.length < 2 || durationsSec.length < path.length - 1) return null

  // Cumulative time (segundos) por arista: el punto avanza a velocidad proporcional
  // a la duración real de cada tramo segÃºn Supabase.
  const cumT: number[] = [0]
  let totalT = 0
  for (const d of durationsSec) {
    totalT += d
    cumT.push(totalT)
  }
  if (totalT <= 0) totalT = path.length - 1

  const rate = readRate()
  const startPerf = performance.now()
  let raf = 0
  let jitterSeed = 4242
  let firstFrame = true

  function rand(): number {
    jitterSeed = (jitterSeed * 1103515245 + 12345) & 0x7fffffff
    return (jitterSeed / 0x7fffffff) * 2 - 1
  }

  /** posición geográfica en el paso de trazo pâ[0,1] (lineal por tiempo) */
  function geoAt(p: number): { lat: number; lng: number; idx: number; fracInSeg: number } {
    const clamped = Math.max(0, Math.min(1, p))
    let lo = 0
    for (let i = 0; i < cumT.length - 1; i++) {
      if (clamped <= cumT[i + 1] / totalT) {
        lo = i
        break
      }
    }
    const segStartT = cumT[lo]
    const segEndT = cumT[lo + 1]
    const segDur = segEndT - segStartT
    const tIn = segDur > 0 ? (clamped * totalT - segStartT) / segDur : 0
    return {
      lat: lerp(path[lo].lat, path[lo + 1].lat, tIn),
      lng: lerp(path[lo].lng, path[lo + 1].lng, tIn),
      idx: lo,
      fracInSeg: tIn,
    }
  }

  function frame(now: number) {
    const elapsed = (now - startPerf) / 1000 * rate // segundos simuladas

    if (firstFrame) {
      // arrancar en el origen exacto
      onPos({
        lat: path[0].lat,
        lng: path[0].lng,
        accuracy: 6,
        timestamp: now,
        remainingSec: totalT,
      })
      firstFrame = false
    } else {
      const p = Math.min(1, elapsed / totalT)
      const g = geoAt(p)
      const remaining = Math.max(0, totalT - elapsed)
      onPos({
        lat: g.lat + rand() * JITTER_DEG,
        lng: g.lng + rand() * JITTER_DEG,
        accuracy: 6,
        timestamp: now,
        remainingSec: remaining,
      })
    }
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return {
    stop: () => cancelAnimationFrame(raf),
  }
}