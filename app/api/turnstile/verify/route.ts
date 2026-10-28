import { NextRequest } from "next/server"
import { auditLog } from "@/lib/bot-defense/audit-log"
import { protect } from "@/lib/bot-defense/guard"

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// Verificación del token de Cloudflare Turnstile en el servidor. El cliente nunca decide
// por sí mismo si pasó: envía el token que produjo el widget y aquí se valida contra
// Cloudflare (con la secret key). Los tokens son de un solo uso, así que no se pueden
// reutilizar en una segunda petición.
export async function POST(req: NextRequest) {
  return protect(req, { scope: "captcha", audit: false }, async (ctx) => {
    const body = await req.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token : ""
    if (!token) {
      return ctx.respond({ ok: false, error: "Completa la verificación de seguridad" }, 400)
    }

    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      console.error("[turnstile] Falta TURNSTILE_SECRET_KEY en el entorno")
      return ctx.respond({ ok: false, error: "Verificación no disponible" }, 500)
    }

    try {
      const form = new URLSearchParams()
      form.append("secret", secret)
      form.append("response", token)
      form.append("remoteip", ctx.ip)

      const resp = await fetch(SITEVERIFY, { method: "POST", body: form })
      const data = (await resp.json()) as { success: boolean; "error-codes"?: string[] }

      if (data.success) {
        auditLog({ ...ctx.baseLog, event: "turnstile_passed", provider: "cloudflare", status: 200 })
        return ctx.respond({ ok: true })
      }

      auditLog({ ...ctx.baseLog, event: "turnstile_failed", provider: "cloudflare", reason: (data["error-codes"] || []).join(","), status: 403 })
      return ctx.respond({ ok: false, error: "Verificación fallida, inténtalo de nuevo" }, 403)
    } catch (err) {
      console.error("[turnstile] Error consultando a Cloudflare:", err)
      return ctx.respond({ ok: false, error: "No se pudo verificar en este momento" }, 502)
    }
  })
}
