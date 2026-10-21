import crypto from "crypto"
import type { NextRequest, NextResponse } from "next/server"
import { randomId, safeEqual, sign } from "./keys"

// Sesión anónima (cookie httpOnly) + tokens CSRF ligados a esa sesión.
// Esquema "synchronizer token" sin estado: el token es HMAC(sesión, nonce, expiración),
// así que sólo sirve con la cookie de la sesión que lo pidió. Una página de otro
// dominio puede hacer que el navegador envíe la cookie, pero no puede leer el token.

export const SESSION_COOKIE = "bd_sid"
const SESSION_MAX_AGE = 60 * 60 // 1 hora
const CSRF_TTL_MS = SESSION_MAX_AGE * 1000

export function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local"
}

export function readSession(req: NextRequest) {
  const existing = req.cookies.get(SESSION_COOKIE)?.value
  const valid = !!existing && /^[0-9a-f-]{36}$/.test(existing)
  return { id: valid ? existing! : crypto.randomUUID(), isNew: !valid }
}

export function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export function createCsrfToken(sessionId: string) {
  const exp = Date.now() + CSRF_TTL_MS
  const nonce = randomId(9)
  return `${exp}.${nonce}.${sign(`csrf:${sessionId}:${exp}:${nonce}`)}`
}

export type CsrfError = "origin" | "missing" | "no-session" | "malformed" | "expired" | "signature"

export function verifyCsrf(req: NextRequest, sessionId: string, sessionIsNew: boolean): CsrfError | null {
  // 1) Origin: si el navegador lo envía, debe ser este mismo sitio
  const origin = req.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) return "origin"
    } catch {
      return "origin"
    }
  }

  // 2) Token en cabecera: un <form> de otro sitio no puede poner cabeceras propias
  const token = req.headers.get("x-csrf-token")
  if (!token) return "missing"
  if (sessionIsNew) return "no-session"

  const [exp, nonce, signature] = token.split(".")
  if (!exp || !nonce || !signature) return "malformed"
  if (Date.now() > Number(exp)) return "expired"
  if (!safeEqual(signature, sign(`csrf:${sessionId}:${exp}:${nonce}`))) return "signature"
  return null
}
