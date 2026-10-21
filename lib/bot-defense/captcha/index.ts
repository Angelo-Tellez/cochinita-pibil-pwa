import crypto from "crypto"
import { consumeNonce, randomId, seal, unseal } from "../keys"
import { checkImagesAnswer, createImagesChallenge } from "./images"
import { checkSliderAnswer, createSliderChallenge } from "./slider"
import { checkTextAnswer, createTextChallenge } from "./text"
import { analyzeTrail, sanitizeTrail, type TrailAnalysis } from "./trail"
import { CAPTCHA_TYPES, type CaptchaType, type PublicChallenge } from "./types"

// Ciclo de vida de un CAPTCHA (igual que reCAPTCHA / hCaptcha, pero propio):
//   1. createChallenge  -> el cliente recibe lo que debe ver + un token cifrado con la respuesta
//   2. verifyChallenge  -> el servidor descifra el token y compara (un solo intento por reto)
//   3. issuePass        -> si acierta, recibe un "pase" de un solo uso
//   4. redeemPass       -> el formulario envía el pase y el servidor lo canjea

const CHALLENGE_TTL_MS = 3 * 60_000
const PASS_TTL_MS = 5 * 60_000

interface SealedChallenge {
  k: "challenge"
  n: string
  type: CaptchaType
  sid: string
  iat: number
  exp: number
  a: unknown
  f?: string[] // fotos del reto de imágenes
}

interface SealedPass {
  k: "pass"
  n: string
  type: CaptchaType
  sid: string
  exp: number
}

export { CAPTCHA_TYPES, type CaptchaType, type PublicChallenge }

function pickType(allowed: readonly CaptchaType[]): CaptchaType {
  return allowed[crypto.randomInt(0, allowed.length)]
}

function createMath() {
  const b = crypto.randomInt(2, 10)
  const a = crypto.randomInt(b, 15) // a >= b para que la resta no sea negativa
  const ops = [
    { symbol: "+", result: a + b },
    { symbol: "×", result: a * b },
    { symbol: "−", result: a - b },
  ]
  const op = ops[crypto.randomInt(0, ops.length)]
  return { question: `¿Cuánto es ${a} ${op.symbol} ${b}?`, answer: op.result }
}

export async function createChallenge(sessionId: string, allowed: readonly CaptchaType[] = CAPTCHA_TYPES): Promise<PublicChallenge> {
  const type = pickType(allowed.length ? allowed : CAPTCHA_TYPES)
  const now = Date.now()
  const base = { k: "challenge" as const, n: randomId(), type, sid: sessionId, iat: now, exp: now + CHALLENGE_TTL_MS }

  switch (type) {
    case "math": {
      const m = createMath()
      return { type, question: m.question, token: seal({ ...base, a: m.answer } satisfies SealedChallenge) }
    }
    case "text": {
      const t = createTextChallenge()
      return { type, image: t.image, token: seal({ ...base, a: t.answer } satisfies SealedChallenge) }
    }
    case "slider": {
      try {
        const s = await createSliderChallenge()
        return { type, ...s.public, token: seal({ ...base, a: s.answer } satisfies SealedChallenge) }
      } catch (err) {
        // Sin sharp no se puede rasterizar el puzzle: se usa otro tipo de reto
        console.error("[captcha] slider no disponible:", err)
        return createChallenge(sessionId, allowed.filter((t) => t !== "slider").length ? allowed.filter((t) => t !== "slider") : ["text"])
      }
    }
    case "images": {
      const im = createImagesChallenge()
      const token = seal({ ...base, a: im.answer, f: im.files } satisfies SealedChallenge)
      // Las imágenes se piden por URL opaca: el nombre del archivo (p. ej. "agua-jamaica")
      // revelaría la categoría, así que sólo viaja cifrado dentro del token.
      const images = im.files.map((_, i) => `/api/captcha/image?t=${token}&i=${i}`)
      return { type, prompt: im.prompt, images, token }
    }
    case "checkbox":
      return { type, token: seal({ ...base, a: null } satisfies SealedChallenge) }
  }
}

// Sólo lectura (sin consumir el nonce): la usa /api/captcha/image
export function peekChallenge(token: unknown, sessionId: string) {
  const c = unseal<SealedChallenge>(token)
  if (!c || c.k !== "challenge" || c.sid !== sessionId || Date.now() > c.exp) return null
  return c
}

export type VerifyError = "malformed" | "session" | "expired" | "reused" | "wrong" | "robot"

export interface VerifyResult {
  ok: boolean
  type?: CaptchaType
  error?: VerifyError
  solveMs?: number
  analysis?: TrailAnalysis
}

function checkCheckbox(c: SealedChallenge, answer: unknown): VerifyResult {
  const a = (answer ?? {}) as { trail?: unknown; trusted?: unknown; touch?: unknown; keyboard?: unknown }
  const solveMs = Date.now() - c.iat
  // Clic generado con element.click() / dispatchEvent: isTrusted = false
  if (a.trusted !== true) return { ok: false, type: c.type, error: "robot", solveMs }
  if (solveMs < 600) return { ok: false, type: c.type, error: "robot", solveMs }
  // En táctil o con teclado no hay trayectoria de mouse: se acepta, el análisis del
  // formulario completo sigue aplicando aparte
  if (a.touch === true || a.keyboard === true) return { ok: true, type: c.type, solveMs }

  const analysis = analyzeTrail(sanitizeTrail(a.trail), { minPoints: 6, minDurationMs: 150 })
  return analysis.robotic
    ? { ok: false, type: c.type, error: "robot", solveMs, analysis }
    : { ok: true, type: c.type, solveMs, analysis }
}

export function verifyChallenge(token: unknown, answer: unknown, sessionId: string): VerifyResult {
  const c = unseal<SealedChallenge>(token)
  if (!c || c.k !== "challenge") return { ok: false, error: "malformed" }
  if (c.sid !== sessionId) return { ok: false, type: c.type, error: "session" }
  if (Date.now() > c.exp) return { ok: false, type: c.type, error: "expired" }
  // Un solo intento por reto: si falla, se genera otro (evita fuerza bruta)
  if (!consumeNonce(c.n, c.exp)) return { ok: false, type: c.type, error: "reused" }

  const solveMs = Date.now() - c.iat
  switch (c.type) {
    case "math":
      return String(answer ?? "").trim() === String(c.a) ? { ok: true, type: c.type, solveMs } : { ok: false, type: c.type, error: "wrong", solveMs }
    case "text":
      return checkTextAnswer(c.a as string, answer) ? { ok: true, type: c.type, solveMs } : { ok: false, type: c.type, error: "wrong", solveMs }
    case "images":
      return checkImagesAnswer(c.a as number[], answer) ? { ok: true, type: c.type, solveMs } : { ok: false, type: c.type, error: "wrong", solveMs }
    case "slider": {
      const r = checkSliderAnswer(c.a as { x: number }, answer)
      return r.ok ? { ok: true, type: c.type, solveMs, analysis: r.analysis } : { ok: false, type: c.type, error: r.reason, solveMs, analysis: r.analysis }
    }
    case "checkbox":
      return checkCheckbox(c, answer)
  }
}

export function issuePass(sessionId: string, type: CaptchaType) {
  return seal({ k: "pass", n: randomId(), type, sid: sessionId, exp: Date.now() + PASS_TTL_MS } satisfies SealedPass)
}

export function redeemPass(token: unknown, sessionId: string): { ok: true; type: CaptchaType } | { ok: false; error: string } {
  const p = unseal<SealedPass>(token)
  if (!p || p.k !== "pass") return { ok: false, error: "malformed" }
  if (p.sid !== sessionId) return { ok: false, error: "session" }
  if (Date.now() > p.exp) return { ok: false, error: "expired" }
  if (!consumeNonce(p.n, p.exp)) return { ok: false, error: "reused" }
  return { ok: true, type: p.type }
}

export const ERROR_MESSAGES: Record<VerifyError, string> = {
  malformed: "Reto inválido, intenta con uno nuevo",
  session: "El reto pertenece a otra sesión",
  expired: "El reto expiró, resuelve uno nuevo",
  reused: "Ese reto ya se usó, resuelve uno nuevo",
  wrong: "Respuesta incorrecta, intenta de nuevo",
  robot: "El movimiento no parece humano. Resuelve este otro reto",
}
