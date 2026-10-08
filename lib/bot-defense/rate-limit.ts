// Rate limiting en memoria con ventana deslizante.
// Nota: en Vercel (serverless) cada instancia tiene su propia memoria; en producción
// esto debería vivir en un store compartido (Redis / Upstash / Firestore).

type Window = number[]

const hits = new Map<string, Window>()
const inFlight = new Map<string, number>()

export const LIMITS = {
  // Por IP: cubre a un bot que abre muchas pestañas (todas comparten IP)
  ip: { max: 20, windowMs: 60_000 },
  // Por IP + sesión: un usuario normal no intenta más de 5 logins por minuto
  session: { max: 5, windowMs: 60_000 },
  // Peticiones simultáneas por IP (peticiones en paralelo de Selenium)
  concurrent: 3,
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSec: number
  reason?: "ip" | "session" | "concurrency"
}

function slide(key: string, max: number, windowMs: number, now: number) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  const allowed = recent.length < max
  if (allowed) recent.push(now)
  hits.set(key, recent)
  const retryAfterSec = allowed ? 0 : Math.ceil((windowMs - (now - recent[0])) / 1000)
  return { allowed, remaining: Math.max(0, max - recent.length), retryAfterSec }
}

export function checkRateLimit(ip: string, sessionId: string): RateLimitResult {
  const now = Date.now()

  const byIp = slide(`ip:${ip}`, LIMITS.ip.max, LIMITS.ip.windowMs, now)
  if (!byIp.allowed) {
    return { allowed: false, limit: LIMITS.ip.max, remaining: 0, retryAfterSec: byIp.retryAfterSec, reason: "ip" }
  }

  const bySession = slide(`sess:${ip}:${sessionId}`, LIMITS.session.max, LIMITS.session.windowMs, now)
  if (!bySession.allowed) {
    return { allowed: false, limit: LIMITS.session.max, remaining: 0, retryAfterSec: bySession.retryAfterSec, reason: "session" }
  }

  return { allowed: true, limit: LIMITS.session.max, remaining: bySession.remaining, retryAfterSec: 0 }
}

// Limita peticiones concurrentes por IP: si llegan en paralelo, las sobrantes se
// rechazan de inmediato (barato) en vez de consumir CPU / llamadas externas.
export function acquireSlot(ip: string): boolean {
  const current = inFlight.get(ip) ?? 0
  if (current >= LIMITS.concurrent) return false
  inFlight.set(ip, current + 1)
  return true
}

export function releaseSlot(ip: string) {
  const current = inFlight.get(ip) ?? 1
  if (current <= 1) inFlight.delete(ip)
  else inFlight.set(ip, current - 1)
}

// Limpieza periódica para que el Map no crezca indefinidamente
const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, w] of hits) {
    if (w.every((t) => now - t > LIMITS.ip.windowMs)) hits.delete(key)
  }
}, 5 * 60_000)
cleanup.unref?.()
