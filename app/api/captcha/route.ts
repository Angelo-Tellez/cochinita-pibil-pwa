import { NextRequest } from "next/server"
import { CAPTCHA_TYPES, createChallenge, type CaptchaType } from "@/lib/bot-defense/captcha"
import { protect } from "@/lib/bot-defense/guard"

// Pide un reto nuevo (botón "otro reto" o la página /seguridad).
// Pedir un tipo "fácil" no sirve para saltarse nada: cada formulario sólo acepta
// pases de los tipos de su política (ver FORM_POLICIES).
export async function POST(req: NextRequest) {
  return protect(req, { scope: "captcha", audit: false }, async (ctx) => {
    const { type } = await req.json().catch(() => ({}))
    const allowed: readonly CaptchaType[] = CAPTCHA_TYPES.includes(type) ? [type] : CAPTCHA_TYPES.filter((t) => t !== "checkbox")
    return ctx.respond({ challenge: await createChallenge(ctx.sessionId, allowed) })
  })
}
