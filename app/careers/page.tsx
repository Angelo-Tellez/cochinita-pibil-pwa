"use client"

import type React from "react"

import { useState } from "react"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function CareersPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "Cocinero",
    experience: "",
    message: "",
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Guardar en localStorage
    const applications = JSON.parse(localStorage.getItem("job_applications") || "[]")
    applications.push({
      ...formData,
      date: new Date().toISOString(),
      id: Date.now(),
    })
    localStorage.setItem("job_applications", JSON.stringify(applications))
    setSubmitted(true)
    setFormData({ name: "", email: "", phone: "", position: "Cocinero", experience: "", message: "" })
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Trabaja Con Nosotros</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl w-full px-4 py-12 sm:px-6 lg:px-8 flex-1">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Únete a Porke</h2>
            <p className="text-lg text-muted-foreground mb-4">
              En Porke estamos siempre buscando personas apasionadas por la gastronomía y con excelente servicio al
              cliente. Si te encanta la Cochinita Pibil y quieres ser parte de nuestra familia, ¡tenemos una oportunidad
              para ti!
            </p>
          </div>

          {/* Posiciones Disponibles */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Posiciones Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Cocinero</h4>
                  <p className="text-sm text-muted-foreground">
                    Preparación de Cochinita Pibil y otros platillos tradicionales yucatecos.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Mesero/a</h4>
                  <p className="text-sm text-muted-foreground">
                    Brindar excelente servicio y atención a nuestros clientes.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Ayudante de Cocina</h4>
                  <p className="text-sm text-muted-foreground">
                    Apoyo en la preparación de ingredientes y limpieza de cocina.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Encargado de Caja</h4>
                  <p className="text-sm text-muted-foreground">
                    Manejo de transacciones y atención al cliente en punto de venta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Application Form */}
          <Card className="border-primary/20 bg-accent/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-primary mb-6">Envía tu Solicitud</h3>

              {submitted && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700">
                  <p className="font-semibold">¡Gracias por tu solicitud!</p>
                  <p className="text-sm">Pronto nos comunicaremos contigo para continuar con el proceso.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Teléfono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+34 999-123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Posición Deseada</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option>Cocinero</option>
                      <option>Mesero/a</option>
                      <option>Ayudante de Cocina</option>
                      <option>Encargado de Caja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Experiencia Previa</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 5 años como cocinero en restaurantes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Mensaje</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Cuéntanos por qué quieres trabajar con nosotros..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                >
                  <Send className="h-4 w-4" />
                  Enviar Solicitud
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
