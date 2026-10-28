import { NextRequest } from "next/server"
import { createChallenge, type CaptchaType } from "@/lib/bot-defense/captcha"
import { protect } from "@/lib/bot-defense/guard"

const VALID: readonly CaptchaType[] = ["math", "slider", "images", "text"]

export async function POST(req: NextRequest) {
  return protect(req, { scope: "captcha", audit: false }, async (ctx) => {
    const body = await req.json().catch(() => ({}))
    // Si el cliente pide un tipo concreto (p. ej. el carrito exige "slider"), se respeta;
    // si no, se alternan todos para que el widget original rote entre ellos.
    const only = typeof body.only === "string" && VALID.includes(body.only as CaptchaType)
      ? [body.only as CaptchaType]
      : VALID
    return ctx.respond({ challenge: await createChallenge(ctx.sessionId, only) })
  })
}