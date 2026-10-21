import { NextRequest } from "next/server"
import { protect } from "@/lib/bot-defense/guard"
import { evaluateSubmission } from "@/lib/bot-defense/human-check"

// Verificación previa al login / registro (el envío final de credenciales va a Firebase).
export async function POST(req: NextRequest) {
  return protect(req, { scope: "form", concurrency: true }, async (ctx) => {
    const body = await req.json().catch(() => ({}))
    const result = await evaluateSubmission(ctx, body)
    return result.ok ? ctx.respond({ ok: true }) : ctx.respond(result.body, result.status)
  })
}
