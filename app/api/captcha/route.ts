import { NextRequest } from "next/server"
import { createChallenge, type CaptchaType } from "@/lib/bot-defense/captcha"
import { protect } from "@/lib/bot-defense/guard"

export async function POST(req: NextRequest) {
  return protect(req, { scope: "captcha", audit: false }, async (ctx) => {
    // Restauramos todos los tipos para que el widget original alterne entre ellos
    const allowed: readonly CaptchaType[] = ["math", "slider", "images", "text"] 
    return ctx.respond({ challenge: await createChallenge(ctx.sessionId, allowed) })
  })
}