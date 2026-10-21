import { NextRequest, NextResponse } from "next/server"
import { auditLog } from "./audit-log"
import { acquireSlot, checkRateLimit, releaseSlot, type Scope } from "./rate-limit"
import { getClientIp, readSession, setSessionCookie, verifyCsrf } from "./session"
import type { HeaderSignals } from "./signals"

// Envoltorio común de las rutas /api: sesión, concurrencia, rate limit y CSRF,
// en ese orden (lo más barato primero). El handler sólo corre si todo pasa.

export interface GuardContext {
  ip: string
  sessionId: string
  headers: HeaderSignals
  baseLog: Record<string, unknown>
  respond: (body: object, status?: number, extraHeaders?: Record<string, string>) => NextResponse
}

interface GuardOptions {
  scope: Scope
  csrf?: boolean
  concurrency?: boolean
  audit?: boolean
}

export async function protect(
  req: NextRequest,
  { scope, csrf = true, concurrency = false, audit = true }: GuardOptions,
  handler: (ctx: GuardContext) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  const ip = getClientIp(req)
  const session = readSession(req)
  const headers: HeaderSignals = {
    userAgent: req.headers.get("user-agent") || "",
    acceptLanguage: req.headers.get("accept-language"),
    secChUa: req.headers.get("sec-ch-ua"),
    secFetchSite: req.headers.get("sec-fetch-site"),
  }
  const baseLog = {
    route: req.nextUrl.pathname,
    ip,
    session: session.id.slice(0, 8),
    ...headers,
    secChUaPlatform: req.headers.get("sec-ch-ua-platform"),
    secChUaMobile: req.headers.get("sec-ch-ua-mobile"),
    referer: req.headers.get("referer"),
  }

  let rlHeaders: Record<string, string> = {}
  const respond = (body: object, status = 200, extraHeaders: Record<string, string> = {}) => {
    const res = NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...rlHeaders, ...extraHeaders } })
    if (session.isNew) setSessionCookie(res, session.id)
    return res
  }

  // 1) Peticiones en paralelo: se cortan antes de hacer cualquier trabajo
  if (concurrency && !acquireSlot(ip)) {
    if (audit) auditLog({ ...baseLog, event: "rate_limited", reason: "concurrency", status: 429 })
    return respond({ error: "Demasiadas peticiones simultáneas" }, 429, { "Retry-After": "2" })
  }

  try {
    // 2) Rate limit por IP y por IP + sesión
    const rl = checkRateLimit(scope, ip, session.id)
    if (!rl.allowed) {
      if (audit) auditLog({ ...baseLog, event: "rate_limited", scope, reason: rl.reason, status: 429 })
      return respond(
        { error: "Demasiados intentos. Espera un momento.", retryAfter: rl.retryAfterSec },
        429,
        { "Retry-After": String(rl.retryAfterSec), "X-RateLimit-Limit": String(rl.limit), "X-RateLimit-Remaining": "0" },
      )
    }
    rlHeaders = { "X-RateLimit-Limit": String(rl.limit), "X-RateLimit-Remaining": String(rl.remaining) }

    // 3) CSRF
    if (csrf) {
      const csrfError = verifyCsrf(req, session.id, session.isNew)
      if (csrfError) {
        if (audit) auditLog({ ...baseLog, event: "csrf_rejected", reason: csrfError, status: 403 })
        return respond({ ok: false, error: "Token CSRF inválido o ausente", csrf: csrfError }, 403, { "X-CSRF-Error": csrfError })
      }
    }

    return await handler({ ip, sessionId: session.id, headers, baseLog, respond })
  } finally {
    if (concurrency) releaseSlot(ip)
  }
}
