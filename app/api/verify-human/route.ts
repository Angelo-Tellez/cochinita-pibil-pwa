import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { checkRateLimit, acquireSlot, releaseSlot, LIMITS } from "@/lib/bot-defense/rate-limit"
import { createChallenge, verifyChallenge } from "@/lib/bot-defense/captcha"
import { assess, type ClientSignals } from "@/lib/bot-defense/signals"
import { auditLog } from "@/lib/bot-defense/audit-log"

const SESSION_COOKIE = "bd_sid"

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local"
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const existingSid = req.cookies.get(SESSION_COOKIE)?.value
  const sessionId = existingSid || crypto.randomUUID()

  const headers = {
    userAgent: req.headers.get("user-agent") || "",
    acceptLanguage: req.headers.get("accept-language"),
    secChUa: req.headers.get("sec-ch-ua"),
    secFetchSite: req.headers.get("sec-fetch-site"),
  }
  const baseLog = {
    ip,
    session: sessionId.slice(0, 8),
    ...headers,
    secChUaPlatform: req.headers.get("sec-ch-ua-platform"),
    secChUaMobile: req.headers.get("sec-ch-ua-mobile"),
    referer: req.headers.get("referer"),
  }

  const respond = (body: object, status: number, extraHeaders: Record<string, string> = {}) => {
    const res = NextResponse.json(body, { status, headers: extraHeaders })
    if (!existingSid) {
      res.cookies.set(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: "strict", path: "/", maxAge: 60 * 60 })
    }
    return res
  }

  // 1) Peticiones en paralelo: se cortan antes de hacer cualquier trabajo
  if (!acquireSlot(ip)) {
    auditLog({ ...baseLog, event: "rate_limited", reason: "concurrency", status: 429 })
    return respond({ error: "Demasiadas peticiones simultáneas" }, 429, { "Retry-After": "2" })
  }

  try {
    // 2) Rate limit por IP y por IP + sesión
    const rl = checkRateLimit(ip, sessionId)
    if (!rl.allowed) {
      auditLog({ ...baseLog, event: "rate_limited", reason: rl.reason, status: 429 })
      return respond(
        { error: "Demasiados intentos. Espera un momento.", retryAfter: rl.retryAfterSec },
        429,
        {
          "Retry-After": String(rl.retryAfterSec),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      )
    }
    const rlHeaders = { "X-RateLimit-Limit": String(LIMITS.session.max), "X-RateLimit-Remaining": String(rl.remaining) }

    const body = await req.json().catch(() => ({}))
    const form: string = body.form || "unknown"
    const signals: Partial<ClientSignals> = body.signals || {}
    const result = assess(signals, headers)
    const log = { ...baseLog, form, score: result.score, reasons: result.reasons, signals }

    // 3) El honeypot no se perdona ni con CAPTCHA
    if (signals.honeypot) {
      auditLog({ ...log, event: "blocked", verdict: "block", status: 403 })
      return respond({ ok: false, blocked: true, error: "Solicitud rechazada" }, 403, rlHeaders)
    }

    // 4) Si el cliente trae respuesta de CAPTCHA, se valida aquí, en el servidor
    if (body.captcha?.token) {
      const check = verifyChallenge(body.captcha.token, String(body.captcha.answer ?? ""))
      if (check.ok) {
        auditLog({ ...log, event: "captcha_passed", verdict: "human", status: 200 })
        return respond({ ok: true }, 200, rlHeaders)
      }
      auditLog({ ...log, event: "captcha_failed", captchaError: check.error, status: 403 })
      return respond(
        { ok: false, requireCaptcha: true, challenge: createChallenge(), error: "Respuesta incorrecta, intenta de nuevo" },
        403,
        rlHeaders,
      )
    }

    // 5) Decisión según la puntuación de riesgo
    if (result.verdict === "human") {
      auditLog({ ...log, event: "passed", verdict: "human", status: 200 })
      return respond({ ok: true }, 200, rlHeaders)
    }

    auditLog({ ...log, event: "challenged", verdict: result.verdict, status: 403 })
    return respond(
      { ok: false, requireCaptcha: true, challenge: createChallenge(), error: "Confirma que eres humano" },
      403,
      rlHeaders,
    )
  } finally {
    releaseSlot(ip)
  }
}
