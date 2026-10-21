import { NextRequest } from "next/server"
import { createChallenge } from "@/lib/bot-defense/captcha"
import { FORM_POLICIES, issueFormSession } from "@/lib/bot-defense/form-session"
import { protect } from "@/lib/bot-defense/guard"

// Carga diferida del formulario: nombres de campo aleatorios, token con la hora de
// emisión y, si el formulario siempre exige CAPTCHA, el primer reto.
export async function POST(req: NextRequest) {
  return protect(req, { scope: "session" }, async (ctx) => {
    const { form } = await req.json().catch(() => ({}))
    const policy = FORM_POLICIES[form]
    if (!policy) return ctx.respond({ error: "Formulario desconocido" }, 400)

    const session = issueFormSession(ctx.sessionId, form)
    const challenge = policy.captcha === "always" ? await createChallenge(ctx.sessionId, policy.challengeTypes) : null
    return ctx.respond({ ...session, challenge })
  })
}
