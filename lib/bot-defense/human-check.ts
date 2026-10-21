import { auditLog } from "./audit-log"
import { createChallenge, redeemPass } from "./captcha"
import { FORM_POLICIES, readFormToken } from "./form-session"
import type { GuardContext } from "./guard"
import { assess, type ClientSignals } from "./signals"

// Decide si el envío de un formulario viene de una persona. Se usa en /api/verify-human
// (login y registro, cuyo envío final va a Firebase) y en /api/contact (que procesa el
// mensaje en la misma petición, así que la verificación no se puede saltar).

export interface SubmissionBody {
  form?: string
  formToken?: string
  signals?: Partial<ClientSignals>
  captchaPass?: string
}

export type HumanCheckResult =
  | { ok: true; log: Record<string, unknown> }
  | { ok: false; status: number; body: object }

export async function evaluateSubmission(ctx: GuardContext, body: SubmissionBody): Promise<HumanCheckResult> {
  const form = String(body.form || "")
  const policy = FORM_POLICIES[form]
  if (!policy) return { ok: false, status: 400, body: { ok: false, error: "Formulario desconocido" } }

  const formSession = readFormToken(body.formToken, ctx.sessionId, form)
  const signals = body.signals || {}
  const result = assess(signals, ctx.headers, { formElapsedMs: formSession?.elapsedMs ?? null })
  const log = { ...ctx.baseLog, form, score: result.score, reasons: result.reasons, serverElapsedMs: formSession?.elapsedMs ?? null, signals }

  const challenge = async (error: string, extra: object = {}) => ({
    ok: false as const,
    status: 403,
    body: { ok: false, requireCaptcha: true, challenge: await createChallenge(ctx.sessionId, policy.challengeTypes), error, ...extra },
  })

  // 1) El honeypot no se perdona ni con CAPTCHA
  if (signals.honeypot) {
    auditLog({ ...log, event: "blocked", verdict: "block", status: 403 })
    return { ok: false, status: 403, body: { ok: false, blocked: true, error: "Solicitud rechazada" } }
  }

  // 2) Si trae un pase de CAPTCHA, se canjea (un solo uso, ligado a la sesión)
  if (body.captchaPass) {
    const pass = redeemPass(body.captchaPass, ctx.sessionId)
    // La casilla es el reto más débil: si el resto de señales dice "bot", se escala
    if (pass.ok && pass.type === "checkbox" && result.verdict === "block") {
      auditLog({ ...log, event: "challenged", verdict: "block", reason: "casilla resuelta pero señales de bot", status: 403 })
      return {
        ok: false,
        status: 403,
        body: { ok: false, requireCaptcha: true, challenge: await createChallenge(ctx.sessionId, ["images", "slider"]), error: "Necesitamos una verificación adicional" },
      }
    }
    if (pass.ok && policy.acceptedPasses.includes(pass.type)) {
      auditLog({ ...log, event: "captcha_passed", captchaType: pass.type, verdict: "human", status: 200 })
      return { ok: true, log }
    }
    auditLog({ ...log, event: "captcha_pass_rejected", reason: pass.ok ? `tipo ${pass.type} no aceptado` : pass.error, status: 403 })
    return challenge("La verificación expiró, resuelve el reto de nuevo")
  }

  // 3) Formularios que siempre exigen CAPTCHA
  if (policy.captcha === "always") {
    auditLog({ ...log, event: "challenged", verdict: "always", status: 403 })
    return challenge("Completa la verificación de seguridad")
  }

  // 4) Decisión según la puntuación de riesgo
  if (result.verdict === "human") {
    auditLog({ ...log, event: "passed", verdict: "human", status: 200 })
    return { ok: true, log }
  }
  auditLog({ ...log, event: "challenged", verdict: result.verdict, status: 403 })
  return challenge("Confirma que eres humano")
}
