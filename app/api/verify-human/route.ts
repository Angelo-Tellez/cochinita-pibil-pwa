import { NextRequest } from "next/server"
import { auditLog } from "@/lib/bot-defense/audit-log"
import { protect } from "@/lib/bot-defense/guard"
import { evaluateSubmission } from "@/lib/bot-defense/human-check"

const normalize = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "")

// Verificación previa al login / registro (el envío final de credenciales va a Firebase).
// protect() aplica sesión, rate limit (5/min por sesión) y CSRF; evaluateSubmission()
// canjea el pase del CAPTCHA (firmado, de un solo uso y ligado a la sesión), así que un
// captchaPass inventado o reutilizado se rechaza aunque el resto del body sea válido.
export async function POST(req: NextRequest) {
  return protect(req, { scope: "form", concurrency: true }, async (ctx) => {
    const body = await req.json().catch(() => ({}))

    // Pregunta de conocimiento del registro: se valida antes de canjear el pase (un 400
    // no consume el pase en el cliente, así el usuario sólo corrige la respuesta)
    if (body.form === "register") {
      const answer = normalize(String(body.data?.securityQuestion ?? ""))
      if (answer !== "yucatan") {
        auditLog({ ...ctx.baseLog, event: "blocked", form: "register", reason: "invalid_security_question", status: 400 })
        return ctx.respond(
          { ok: false, error: "Respuesta incorrecta. Pista: Es el estado del sureste mexicano famoso por este platillo." },
          400,
        )
      }
    }

    const result = await evaluateSubmission(ctx, body)
    return result.ok ? ctx.respond({ ok: true }) : ctx.respond(result.body, result.status)
  })
}
