"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Clock, User } from "lucide-react"
import Link from "next/link"
import { saveOrder } from "@/lib/orders-service"
const PICKUP_TIMES = ["15 minutos", "30 minutos", "45 minutos", "1 hora", "1 hora 30 min", "2 horas"]

interface FormData {
  name: string
  email: string
  phone: string
  specialInstructions: string
  pickupTime: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, isLoaded: cartLoaded, clearCart } = useCart()
  const { user, isLoaded: authLoaded } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    specialInstructions: "",
    pickupTime: "30 minutos",
  })

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || "",  // ← era user.name
        email: user.email || "",
      }))
    }
  }, [user])

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.085
  const total = subtotal + tax

  if (!cartLoaded || !authLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/cart">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver al Carrito
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <h2 className="mb-4 text-2xl font-bold text-card-foreground">Se requiere iniciar sesión</h2>
              <p className="mb-8 text-muted-foreground">
                Por favor inicia sesión o crea una cuenta para completar tu pedido.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/login">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Crear Cuenta</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/cart">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver al Carrito
              </Button>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <h2 className="mb-4 text-2xl font-bold text-card-foreground">Carrito Vacío</h2>
              <p className="mb-8 text-muted-foreground">
                Por favor agrega artículos a tu carrito antes de proceder al checkout.
              </p>
              <Link href="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Ir al Menú</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.phone.trim()) {
      alert("Por favor ingresa tu teléfono")
      return false
    }
    return true
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!validateForm()) return
  setIsSubmitting(true)

  try {
    const orderId = await saveOrder({
      userId: user.uid,                    // ← era user.id
      date: new Date().toISOString(),
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      items: cart,
      subtotal,
      tax,
      total,
      pickupTime: formData.pickupTime,
      specialInstructions: formData.specialInstructions,
      status: "pending",
    })

    clearCart()
    router.push(`/order-confirmation/${orderId}`)
  } catch (error) {
    console.error("Error creating order:", error)
    alert("Hubo un error al crear el pedido. Por favor intenta de nuevo.")
    setIsSubmitting(false)
  }
}

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/cart">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
                Volver al Carrito
              </Button>
            </Link>
              <p className="text-sm text-muted-foreground">Sesión: {user.displayName}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Completar Pedido</h1>

        <form onSubmit={handleSubmitOrder} className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nombre Completo</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Juan Pérez"
                    className="w-full"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Usa tu nombre registrado</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Correo Electrónico</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@example.com"
                    className="w-full"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Usa tu email registrado</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Teléfono *</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pickup Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tiempo de Recogida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Selecciona cuándo deseas recoger tu pedido *
                </label>
                <select
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                >
                  {PICKUP_TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instrucciones Especiales</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notas o preferencias (opcional)
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  placeholder="Ej: Sin picante, extra cilantro..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 border-b border-border pb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto (8.5%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
                </Button>

                <Link href="/" className="block">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Continuar Comprando
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  )
}
