import type { TrailPoint } from "./types"

// Analiza la trayectoria del puntero (arrastre del slider o camino hasta la casilla).
// Una persona acelera, frena y tiembla; Selenium (ActionChains) salta directo al
// destino o se mueve en línea recta a velocidad constante.

export interface TrailAnalysis {
  robotic: boolean
  score: number
  reasons: string[]
  stats: { points: number; durationMs: number; speedCv: number; maxDeviation: number }
}

const MAX_POINTS = 400

export function sanitizeTrail(raw: unknown): TrailPoint[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(-MAX_POINTS)
    .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.t))
    .map((p) => ({ x: Number(p.x), y: Number(p.y), t: Number(p.t) }))
}

export function analyzeTrail(trail: TrailPoint[], opts: { minPoints: number; minDurationMs: number }): TrailAnalysis {
  const reasons: string[] = []
  let score = 0
  const add = (points: number, reason: string) => { score += points; reasons.push(`+${points} ${reason}`) }

  const durationMs = trail.length > 1 ? trail[trail.length - 1].t - trail[0].t : 0

  // Velocidad por segmento y su coeficiente de variación (σ / media)
  const speeds: number[] = []
  for (let i = 1; i < trail.length; i++) {
    const dt = trail[i].t - trail[i - 1].t
    if (dt <= 0) continue
    speeds.push(Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y) / dt)
  }
  const mean = speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1)
  const sd = Math.sqrt(speeds.reduce((a, v) => a + (v - mean) ** 2, 0) / (speeds.length || 1))
  const speedCv = mean > 0 ? sd / mean : 0

  // Desviación máxima respecto a la línea recta entre el primer y el último punto
  let maxDeviation = 0
  if (trail.length > 2) {
    const a = trail[0]
    const b = trail[trail.length - 1]
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    for (const p of trail) {
      const d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len
      if (d > maxDeviation) maxDeviation = d
    }
  }

  if (trail.length < opts.minPoints) add(2, `trayectoria con sólo ${trail.length} puntos`)
  if (durationMs < opts.minDurationMs) add(2, `movimiento en ${Math.round(durationMs)} ms`)
  if (speeds.length >= 4 && speedCv < 0.15) add(1, `velocidad constante (CV=${speedCv.toFixed(2)})`)
  if (trail.length > 2 && maxDeviation < 1) add(1, "línea perfectamente recta")

  return {
    robotic: score >= 2,
    score,
    reasons,
    stats: { points: trail.length, durationMs: Math.round(durationMs), speedCv: Number(speedCv.toFixed(3)), maxDeviation: Number(maxDeviation.toFixed(2)) },
  }
}
