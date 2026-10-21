import { shared } from "./keys"

// Rate limiting en memoria con ventana deslizante, separado por "ámbito" para que
// cargar las imágenes de un CAPTCHA no consuma los intentos de login.
// Nota: en Vercel (serverless) cada instancia tiene su propia memoria; en producción
// esto debería vivir en un store compartido (Redis / Upstash / Firestore).

type Window = number[]

const hits = shared("rlHits", () => new Map<string, Window>())
const inFlight = shared("rlInFlight", () => new Map<string, number>())

const WINDOW_MS = 60_000

export const LIMITS = {
  // Envío de formularios (login, registro, contacto): un humano no hace más de 5 por minuto
  form: { ip: 20, session: 5 },
  // Pedir / resolver retos CAPTCHA
  captcha: { ip: 60, session: 20 },
  // Imágenes de los retos (9 por reto de selección)
  image: { ip: 300, session: 150 },
  // Emisión de sesión / token CSRF y del formulario diferido
  session: { ip: 40, session: 40 },
  // Otras APIs (notificaciones, pagos)
  api: { ip: 30, session: 10 },
  // Peticiones simultáneas por IP (peticiones en paralelo de Selenium)
  concurrent: 3,
}

export type Scope = Exclude<keyof typeof LIMITS, "concurrent">

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSec: number
  reason?: "ip" | "session"
}

function slide(key: string, max: number, now: number) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  const allowed = recent.length < max
  if (allowed) recent.push(now)
  hits.set(key, recent)
  const retryAfterSec = allowed ? 0 : Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)
  return { allowed, remaining: Math.max(0, max - recent.length), retryAfterSec }
}

export function checkRateLimit(scope: Scope, ip: string, sessionId: string): RateLimitResult {
  const now = Date.now()
  const limits = LIMITS[scope]

  // Por IP: cubre a un bot que abre muchas pestañas o descarta la cookie (todas comparten IP)
  const byIp = slide(`${scope}:ip:${ip}`, limits.ip, now)
  if (!byIp.allowed) {
    return { allowed: false, limit: limits.ip, remaining: 0, retryAfterSec: byIp.retryAfterSec, reason: "ip" }
  }

  const bySession = slide(`${scope}:sess:${ip}:${sessionId}`, limits.session, now)
  if (!bySession.allowed) {
    return { allowed: false, limit: limits.session, remaining: 0, retryAfterSec: bySession.retryAfterSec, reason: "session" }
  }

  return { allowed: true, limit: limits.session, remaining: bySession.remaining, retryAfterSec: 0 }
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
shared("rlCleanup", () => {
  const t = setInterval(() => {
    const now = Date.now()
    for (const [key, w] of hits) {
      if (w.every((t) => now - t > WINDOW_MS)) hits.delete(key)
    }
  }, 5 * 60_000)
  t.unref?.()
  return t
})
