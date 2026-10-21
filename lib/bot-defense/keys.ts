import crypto from "crypto"

// Primitivas criptográficas compartidas por todas las defensas.
// En desarrollo, Next.js puede cargar este módulo varias veces (un bundle por ruta),
// por eso el secreto y los mapas en memoria se guardan en globalThis: así un token
// emitido por /api/captcha se puede validar en /api/captcha/verify.

const g = globalThis as typeof globalThis & { __botDefense?: Record<string, unknown> }
const store = (g.__botDefense ??= {})

export function shared<T>(key: string, init: () => T): T {
  if (!(key in store)) store[key] = init()
  return store[key] as T
}

// Define BOT_DEFENSE_SECRET en .env.local (y en Vercel) para que los tokens
// sobrevivan a reinicios del servidor y funcionen entre instancias.
const SECRET = shared("secret", () => process.env.BOT_DEFENSE_SECRET || crypto.randomBytes(32).toString("hex"))
const ENC_KEY = crypto.createHash("sha256").update(`enc:${SECRET}`).digest()

export function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url")
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

export function randomId(bytes = 12) {
  return crypto.randomBytes(bytes).toString("base64url")
}

// Cifrado autenticado (AES-256-GCM): el cliente recibe un token opaco que no puede
// leer ni modificar. Así la respuesta de un CAPTCHA viaja con el reto sin que el
// navegador (ni un bot que inspeccione el DOM) la conozca.
export function seal(data: object): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv)
  const ct = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64url")
}

export function unseal<T>(token: unknown): T | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 4096) return null
  try {
    const raw = Buffer.from(token, "base64url")
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    const pt = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()])
    return JSON.parse(pt.toString("utf8")) as T
  } catch {
    return null
  }
}

// Nonces de un solo uso (retos CAPTCHA y pases): evita reutilizar un token (replay)
const usedNonces = shared("usedNonces", () => new Map<string, number>())

export function consumeNonce(nonce: string, expires: number): boolean {
  if (usedNonces.has(nonce)) return false
  usedNonces.set(nonce, expires)
  return true
}

shared("nonceCleanup", () => {
  const t = setInterval(() => {
    const now = Date.now()
    for (const [nonce, exp] of usedNonces) if (now > exp) usedNonces.delete(nonce)
  }, 5 * 60_000)
  t.unref?.()
  return t
})
