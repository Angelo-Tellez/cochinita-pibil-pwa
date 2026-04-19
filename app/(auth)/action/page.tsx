"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { applyActionCode } from "firebase/auth"
import { createUserProfile, getUserProfile } from "@/lib/users-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

function ActionHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const mode = searchParams.get("mode")
    const oobCode = searchParams.get("oobCode")

    if (!oobCode) {
      setStatus("error")
      setMessage("Enlace inválido o expirado.")
      return
    }

    if (mode === "verifyEmail") {
      handleVerifyEmail(oobCode)
    } else {
      setStatus("error")
      setMessage("Acción no reconocida.")
    }
  }, [])

  const handleVerifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode)

      // Guardar perfil en Firestore si aún no existe
      if (auth.currentUser) {
        const existing = await getUserProfile(auth.currentUser.uid)
        if (!existing) {
          const pending = localStorage.getItem("pending-profile")
          if (pending) {
            const { name, phone } = JSON.parse(pending)
            await createUserProfile({
              uid: auth.currentUser.uid,
              name: auth.currentUser.displayName || name,
              email: auth.currentUser.email || "",
              phone,
              provider: "email",
              createdAt: new Date().toISOString(),
            })
            localStorage.removeItem("pending-profile")
          }
        }
      }

      setStatus("success")
    } catch (error: any) {
      setStatus("error")
      setMessage("El enlace expiró o ya fue usado. Intenta registrarte de nuevo.")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-muted-foreground">Verificando tu correo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-6">
            {/* Ícono de éxito */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">¡Correo verificado!</h1>
              <p className="text-muted-foreground">
                Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión y hacer tu primer pedido.
              </p>
            </div>

            {/* Logo del restaurante */}
            <div className="py-4 border-y border-border">
              <p className="text-primary font-bold text-xl">Porké</p>
              <p className="text-muted-foreground text-sm">Comida Yucateca Auténtica</p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver el Menú
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Enlace inválido</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
          <Link href="/register" className="block">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Volver al Registro
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <ActionHandler />
    </Suspense>
  )
}