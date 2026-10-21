"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Honeypot, CaptchaWidget, FormSkeleton } from "@/components/human-check"
import { useHumanCheck } from "@/hooks/use-human-check"

const SUBJECTS = [
  { value: "pedido", label: "Un pedido" },
  { value: "facturacion", label: "Facturación" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "otro", label: "Otro" },
]

const EMPTY = { name: "", email: "", subject: "pedido", message: "" }

export default function ContactPage() {
  const [formData, setFormData] = useState(EMPTY)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { formRef, ready, loadError, reload, fieldNames, fieldFromName, verify, honeypotProps, captcha } = useHumanCheck(
    "contact",
    ["name", "email", "subject", "message"] as const,
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = fieldFromName(e.target.name)
    if (field) setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (formData.name.trim().length < 2) { setError("Escribe tu nombre"); return }
    if (!formData.email.trim()) { setError("Escribe tu email"); return }
    if (formData.message.trim().length < 10) { setError("El mensaje debe tener al menos 10 caracteres"); return }

    setIsLoading(true)
    // La verificación humana y el guardado ocurren en la misma petición a /api/contact
    const result = await verify(e, { endpoint: "/api/contact", data: formData })
    setIsLoading(false)
    if (!result.ok) { setError(result.error); return }
    setSent(true)
    setFormData(EMPTY)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Contáctanos</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Envíanos un mensaje
            </CardTitle>
            <p className="text-sm text-muted-foreground">Te respondemos por correo en menos de 24 horas.</p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <p className="font-semibold text-foreground">¡Mensaje enviado!</p>
                <p className="text-sm text-muted-foreground">Gracias por escribirnos.</p>
                <Button variant="outline" onClick={() => { setSent(false); reload() }}>Enviar otro mensaje</Button>
              </div>
            ) : !ready ? (
              <FormSkeleton fields={4} error={loadError} onRetry={reload} />
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">{error}</div>
                )}
                <div>
                  <label htmlFor={fieldNames.name} className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                  <Input id={fieldNames.name} name={fieldNames.name} autoComplete="name" value={formData.name} onChange={handleChange} placeholder="Juan Pérez" />
                </div>
                <div>
                  <label htmlFor={fieldNames.email} className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input type="email" id={fieldNames.email} name={fieldNames.email} autoComplete="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" />
                </div>
                <div>
                  <label htmlFor={fieldNames.subject} className="block text-sm font-medium text-foreground mb-1">Asunto</label>
                  <select
                    id={fieldNames.subject}
                    name={fieldNames.subject}
                    value={formData.subject}
                    onChange={handleChange}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={fieldNames.message} className="block text-sm font-medium text-foreground mb-1">Mensaje</label>
                  <Textarea id={fieldNames.message} name={fieldNames.message} rows={5} value={formData.message} onChange={handleChange} placeholder="¿En qué te podemos ayudar?" />
                </div>
                <Honeypot {...honeypotProps} />
                <CaptchaWidget {...captcha} />
                <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {isLoading ? "Enviando..." : "Enviar mensaje"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
