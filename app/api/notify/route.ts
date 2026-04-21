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
  } catch (error) {
    console.error("Error enviando notificación:", error)
    return NextResponse.json({ error: "Error enviando notificación" }, { status: 500 })
  }
}