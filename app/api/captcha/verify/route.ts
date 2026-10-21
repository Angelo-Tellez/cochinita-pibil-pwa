import { NextRequest } from "next/server"
import { auditLog } from "@/lib/bot-defense/audit-log"
import { createChallenge, ERROR_MESSAGES, issuePass, verifyChallenge, type CaptchaType } from "@/lib/bot-defense/captcha"
import { protect } from "@/lib/bot-defense/guard"

// Valida la respuesta de un reto. Si es correcta entrega un pase de un solo uso;
// si no, entrega otro reto (un intento por reto). Si la casilla "No soy un robot"
// detecta movimiento de bot, escala a un reto más difícil (como reCAPTCHA).
export async function POST(req: NextRequest) {
  return protect(req, { scope: "captcha" }, async (ctx) => {
    const { token, answer } = await req.json().catch(() => ({}))
    const result = verifyChallenge(token, answer, ctx.sessionId)
    const log = { ...ctx.baseLog, captchaType: result.type, solveMs: result.solveMs, trail: result.analysis }

    if (result.ok && result.type) {
      auditLog({ ...log, event: "captcha_solved", status: 200 })
      return ctx.respond({ ok: true, pass: issuePass(ctx.sessionId, result.type) })
    }

    auditLog({ ...log, event: "captcha_failed", captchaError: result.error, status: 403 })
    let next: CaptchaType[] = result.type ? [result.type] : ["math"]
    if (result.error === "robot") next = ["images", "slider"]
    return ctx.respond(
      { ok: false, error: ERROR_MESSAGES[result.error ?? "malformed"], challenge: await createChallenge(ctx.sessionId, next) },
      403,
    )
  })
}
