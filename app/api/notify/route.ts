import { NextRequest, NextResponse } from "next/server"
import admin from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 })
    }

    await admin.messaging().send({
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/porke-logo.png",
          vibrate: [200, 100, 200],
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error completo:", JSON.stringify(error, null, 2))
    console.error("Mensaje:", error.message)
    console.error("Codigo:", error.code)
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: 500 })
  }
}
