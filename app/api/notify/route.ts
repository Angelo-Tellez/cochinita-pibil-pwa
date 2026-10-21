import { NextRequest } from "next/server"
import admin from "@/lib/firebase-admin"
import { protect } from "@/lib/bot-defense/guard"

export async function POST(req: NextRequest) {
  return protect(req, { scope: "api" }, async ({ respond }) => {
    try {
      const { token, title, body } = await req.json()

      if (!token) {
        return respond({ error: "Token requerido" }, 400)
      }

      await admin.messaging().send({
        token,
        data: {
          title,
          body,
        },
        webpush: {
          notification: {
            title,
            body,
            icon: "/porke-logo.png",
          },
        },
      })

      return respond({ success: true })
    } catch (error: any) {
      console.error("Error completo:", JSON.stringify(error, null, 2))
      console.error("Mensaje:", error.message)
      console.error("Codigo:", error.code)
      return respond({
        error: error.message,
        code: error.code
      }, 500)
    }
  })
}
