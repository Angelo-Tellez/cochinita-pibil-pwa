"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, Copy, Clock } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { Order } from "@/lib/orders-service"

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id)
        const snapshot = await getDoc(docRef)
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() } as Order)
        }
      } catch (error) {
        console.error("Error cargando pedido:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const copyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(`#${order.id.slice(-6)}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando pedido...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver
              </Button>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <p className="text-muted-foreground">No se encontró el pedido.</p>
              <Link href="/">
                <Button className="mt-4 bg-primary text-primary-foreground">Ir al Menú</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
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

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="py-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">Pedido Confirmado</h1>
            <p className="text-green-700">Tu pedido ha sido recibido exitosamente</p>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Número de Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-primary flex-1">
                    #{order.id?.slice(-6)}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyOrderId}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Información de Recogida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hora de Recogida Estimada</p>
                  <p className="text-lg font-semibold text-foreground">En {order.pickupTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
                  <p className="text-lg font-semibold text-foreground">Porké — Comida Yucateca</p>
                  <p className="text-sm text-muted-foreground mt-1">Metepec, Estado de México</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium text-foreground">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                  <p className="font-medium text-foreground">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium text-foreground">{order.customer.phone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Artículos del Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {order.specialInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Instrucciones Especiales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{order.specialInstructions}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto (8.5%)</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
                <Link href="/">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Volver al Menú
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}