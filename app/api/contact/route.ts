import { NextRequest } from "next/server"
import fs from "fs"
import path from "path"
import { z } from "zod"
import { auditLog } from "@/lib/bot-defense/audit-log"
import { protect } from "@/lib/bot-defense/guard"
import { evaluateSubmission } from "@/lib/bot-defense/human-check"

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.string().trim().email("Email inválido").max(120),
  subject: z.enum(["pedido", "facturacion", "sugerencia", "otro"]),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000),
})

// A diferencia del login, aquí la verificación humana y el procesamiento ocurren en
// la misma petición: no hay forma de llegar al guardado sin pasar las defensas.
export async function POST(req: NextRequest) {
  return protect(req, { scope: "form", concurrency: true }, async (ctx) => {
    const body = await req.json().catch(() => ({}))
    // Se valida primero el contenido para no gastar el pase del CAPTCHA en un mensaje inválido
    const parsed = ContactSchema.safeParse(body.data)
    if (!parsed.success) return ctx.respond({ ok: false, error: parsed.error.issues[0].message }, 400)

    const check = await evaluateSubmission(ctx, { ...body, form: "contact" })
    if (!check.ok) return ctx.respond(check.body, check.status)

    const message = { ...parsed.data, createdAt: new Date().toISOString(), ip: ctx.ip }
    let stored = false
    try {
      const admin = (await import("@/lib/firebase-admin")).default
      await admin.firestore().collection("contactMessages").add(message)
      stored = true
    } catch (err) {
      console.error("[contact] Firestore no disponible:", err)
    }
    if (!stored) {
      try {
        const file = path.join(process.cwd(), "logs", "contact-messages.log")
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.appendFileSync(file, JSON.stringify(message) + "\n")
        stored = true
      } catch {}
    }

    auditLog({ ...ctx.baseLog, event: "contact_saved", stored, status: stored ? 200 : 500 })
    return stored
      ? ctx.respond({ ok: true })
      : ctx.respond({ ok: false, error: "No pudimos guardar tu mensaje, intenta más tarde" }, 500)
  })
}
