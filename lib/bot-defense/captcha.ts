import crypto from "crypto"

// CAPTCHA de texto (operación aritmética) generado y validado en el servidor.
// El cliente sólo recibe la pregunta y un token firmado con HMAC: la respuesta
// correcta nunca viaja al navegador, así que no se puede leer desde el DOM o el JS.

const SECRET = process.env.BOT_DEFENSE_SECRET || crypto.randomBytes(32).toString("hex")
const TTL_MS = 2 * 60_000

// Nonces ya usados: un token sólo se puede canjear una vez (evita replay)
const usedNonces = new Map<string, number>()

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")
}

function hashAnswer(answer: string, nonce: string) {
  return sign(`${nonce}:${answer.trim()}`)
}

export interface Challenge {
  question: string
  token: string
}

export function createChallenge(): Challenge {
  const b = crypto.randomInt(2, 10)
  const a = crypto.randomInt(b, 15) // a >= b para que la resta no sea negativa
  const ops = [
    { symbol: "+", result: a + b },
    { symbol: "×", result: a * b },
    { symbol: "−", result: a - b },
  ]
  const op = ops[crypto.randomInt(0, ops.length)]
  const nonce = crypto.randomBytes(12).toString("base64url")
  const expires = Date.now() + TTL_MS
  const answerHash = hashAnswer(String(op.result), nonce)
  const body = Buffer.from(JSON.stringify({ nonce, expires, answerHash })).toString("base64url")

  return {
    question: `¿Cuánto es ${a} ${op.symbol} ${b}?`,
    token: `${body}.${sign(body)}`,
  }
}

export type CaptchaResult = { ok: true } | { ok: false; error: "malformed" | "signature" | "expired" | "reused" | "wrong" }

export function verifyChallenge(token: string, answer: string): CaptchaResult {
  const [body, signature] = (token || "").split(".")
  if (!body || !signature) return { ok: false, error: "malformed" }

  const expected = sign(body)
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { ok: false, error: "signature" }
  }

  const { nonce, expires, answerHash } = JSON.parse(Buffer.from(body, "base64url").toString())
  if (Date.now() > expires) return { ok: false, error: "expired" }
  if (usedNonces.has(nonce)) return { ok: false, error: "reused" }
  usedNonces.set(nonce, expires)

  if (hashAnswer(answer, nonce) !== answerHash) return { ok: false, error: "wrong" }
  return { ok: true }
}

const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [nonce, exp] of usedNonces) if (now > exp) usedNonces.delete(nonce)
}, 5 * 60_000)
cleanup.unref?.()
