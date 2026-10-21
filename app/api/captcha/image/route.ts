import { NextRequest, NextResponse } from "next/server"
import { peekChallenge } from "@/lib/bot-defense/captcha"
import { GRID_SIZE, renderTile } from "@/lib/bot-defense/captcha/images"
import { protect } from "@/lib/bot-defense/guard"

// Sirve un mosaico del reto de imágenes a partir del token cifrado: el navegador
// nunca ve el nombre real del archivo. Es GET (lo pide un <img>), así que no lleva
// token CSRF; sólo responde a la sesión dueña del reto.
export async function GET(req: NextRequest) {
  return protect(req, { scope: "image", csrf: false, audit: false }, async (ctx) => {
    const token = req.nextUrl.searchParams.get("t")
    const i = Number(req.nextUrl.searchParams.get("i"))
    const challenge = peekChallenge(token, ctx.sessionId)
    if (!challenge || challenge.type !== "images" || !challenge.f || !Number.isInteger(i) || i < 0 || i >= GRID_SIZE) {
      return ctx.respond({ error: "Imagen no disponible" }, 404)
    }
    const tile = await renderTile(challenge.f[i])
    return new NextResponse(new Uint8Array(tile.body), {
      headers: { "Content-Type": tile.type, "Cache-Control": "no-store" },
    })
  })
}
