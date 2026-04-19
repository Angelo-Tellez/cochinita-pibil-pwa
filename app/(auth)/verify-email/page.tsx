"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/firebase"
import { sendEmailVerification } from "firebase/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user, isLoaded, checkEmailVerified, logout } = useAuth()
  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState("")

    useEffect(() => {
    // Solo redirige si Firebase ya cargó Y no hay usuario
    if (isLoaded && !user) {
        router.push("/login")
    }
    }, [isLoaded, user])

  const handleCheckVerification = async () => {
    setChecking(true)
    setMessage("")
    const verified = await checkEmailVerified()
    if (verified) {
      router.push("/")
    } else {
      setMessage("Aún no hemos recibido la verificación. Revisa tu correo y haz clic en el enlace.")
    }
    setChecking(false)
  }

  const handleResendEmail = async () => {
    if (!auth.currentUser) return
    setResending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      setMessage("Correo reenviado. Revisa tu bandeja de entrada.")
    } catch (error) {
      setMessage("Error al reenviar el correo. Intenta de nuevo en un momento.")
    }
    setResending(false)
  }

  const handleCancel = async () => {
    await logout()
    router.push("/register")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifica tu correo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
            <p className="text-blue-800 font-medium mb-1">Correo enviado</p>
            <p className="text-blue-700 text-sm">
              Te enviamos un enlace de verificación a{" "}
              <span className="font-semibold">{user?.email}</span>.
              Haz clic en el enlace para activar tu cuenta.
            </p>
          </div>

          {message && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
              {message}
            </div>
          )}

          <Button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {checking ? "Verificando..." : "Ya verifiqué mi correo"}
          </Button>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full bg-transparent"
          >
            {resending ? "Enviando..." : "Reenviar correo"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-muted-foreground"
          >
            Cancelar y volver al registro
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}