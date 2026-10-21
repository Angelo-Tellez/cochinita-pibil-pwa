import { NextRequest } from "next/server"
import { protect } from "@/lib/bot-defense/guard"
import { createCsrfToken } from "@/lib/bot-defense/session"

export const dynamic = "force-dynamic"

// Crea la cookie de sesión (httpOnly) y entrega el token CSRF ligado a ella.
// Es GET: otro sitio puede provocar la petición, pero la política de mismo origen
// le impide leer la respuesta, así que nunca obtiene el token.
export async function GET(req: NextRequest) {
  return protect(req, { scope: "session", csrf: false, audit: false }, (ctx) =>
    ctx.respond({ csrfToken: createCsrfToken(ctx.sessionId) }),
  )
}
