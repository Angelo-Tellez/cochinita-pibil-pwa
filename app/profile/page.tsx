"use client"

import { getUserProfile, updateUserPhone, updateUserName } from "@/lib/users-service"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, User, Phone, Mail, Save, Pencil, X } from "lucide-react"
import Link from "next/link"
import {
  verifyBeforeUpdateEmail,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function ProfilePage() {
  const { user, isLoaded } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Email change
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login?redirect=/profile")
      return
    }
    if (user) {
      setName(user.displayName || "")
      getUserProfile(user.uid).then((profile) => {
        if (profile?.phone) setPhone(profile.phone)
      })
    }
  }, [user, isLoaded])

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre no puede estar vacío")
      return
    }
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      await updateUserName(user!.uid, name)
      if (phone.trim()) {
        await updateUserPhone(user!.uid, phone)
      }
      setSuccess("¡Cambios guardados correctamente!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Error al guardar los cambios")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendEmailVerification = async () => {
    if (!newEmail.trim()) {
      setEmailError("Ingresa el nuevo correo")
      return
    }
    if (newEmail === user?.email) {
      setEmailError("El nuevo correo es igual al actual")
      return
    }
    setIsSendingEmail(true)
    setEmailError("")
    try {
      await verifyBeforeUpdateEmail(auth.currentUser!, newEmail)
      setEmailSent(true)
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setEmailError("Este correo ya está en uso")
      } else if (err.code === "auth/invalid-email") {
        setEmailError("Correo inválido")
      } else {
        setEmailError("Error al enviar verificación. Intenta de nuevo.")
      }
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
              Volver al Menú
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground mb-8">Mi Perfil</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre
              </label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Teléfono
              </label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 (555) 123-4567"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2 bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>

            {/* Separador */}
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setShowEmailForm(!showEmailForm)
                    setEmailSent(false)
                    setEmailError("")
                    setNewEmail("")
                  }}
                >
                  {showEmailForm ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </div>

              {showEmailForm && !emailSent && (
                <div className="mt-3 space-y-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nuevo correo electrónico"
                  />
                  {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                  <Button
                    onClick={handleSendEmailVerification}
                    disabled={isSendingEmail}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    {isSendingEmail ? "Enviando..." : "Enviar verificación"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Te enviaremos un enlace al nuevo correo para confirmar el cambio.
                  </p>
                </div>
              )}

              {emailSent && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Correo de verificación enviado
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Revisa tu bandeja de entrada en <strong>{newEmail}</strong> y haz clic en el enlace para confirmar el cambio.
                  </p>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  )
}