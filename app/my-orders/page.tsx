"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { type Order } from "@/lib/orders-service"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { requestNotificationPermission } from "@/lib/push-notifications"

export default function MyOrdersPage() {
  const { user, isLoaded: authLoaded } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const handleEnableNotifications = async () => {
      if (!user) return
      const granted = await requestNotificationPermission(user.uid)
      setNotificationsEnabled(granted)
      if (granted) {
        alert("¡Notificaciones activadas! Te avisaremos cuando tu pedido esté listo.")
      }
    }
    
  useEffect(() => {
    if (!authLoaded) return
    if (!user) {
      setIsLoaded(true)
      return
    }

    

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Order[]
      setOrders(data)

      // ← actualizar el pedido seleccionado si cambió su estado
      setSelectedOrder((prev) => {
        if (!prev) return prev
        const updated = data.find((o) => o.id === prev.id)
        return updated || prev
      })

      setIsLoaded(true)
    }, (error) => {
      console.error("Error en tiempo real:", error)
      setIsLoaded(true)
    })

    return () => unsubscribe()
  }, [authLoaded, user])

  if (!isLoaded) {
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
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="w-20 flex justify-end">
            {!notificationsEnabled && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnableNotifications}
                className="text-xs gap-1"
              >
                🔔 Activar
              </Button>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <h2 className="mb-4 text-2xl font-bold text-card-foreground">Se requiere iniciar sesión</h2>
              <p className="mb-8 text-muted-foreground">Por favor inicia sesión para ver tus pedidos.</p>
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

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "preparing": return "bg-blue-100 text-blue-800"
      case "ready": return "bg-green-100 text-green-800"
      case "completed": return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "preparing": return <Clock className="h-4 w-4" />
      case "ready": return <CheckCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: Order["status"]) => {
    const labels: Record<Order["status"], string> = {
      pending: "Pendiente",
      preparing: "En Preparación",
      ready: "Listo",
      completed: "Completado",
    }
    return labels[status]
  }

  const getStatusMessage = (status: Order["status"]) => {
    const messages: Record<Order["status"], string> = {
      pending: "Tu pedido fue recibido y está siendo procesado",
      preparing: "Tu pedido se está preparando en la cocina",
      ready: "¡Tu pedido está listo! Pasa a recogerlo",
      completed: "Tu pedido fue retirado",
    }
    return messages[status]
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
                Volver
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Mis Pedidos</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-12">
              <h2 className="mb-4 text-2xl font-bold text-card-foreground">Sin pedidos</h2>
              <p className="mb-8 text-muted-foreground">Aún no has realizado ningún pedido.</p>
              <Link href="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Ir al Menú</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer transition-all ${selectedOrder?.id === order.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-card-foreground">Pedido #{order.id?.slice(-6)}</h3>
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString("es-MX", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                          })}
                        </p>
                        <p className="text-sm font-semibold mt-2">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              {selectedOrder ? (
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Detalles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`p-4 rounded-lg ${selectedOrder.status === "ready" ? "bg-green-50 border border-green-200" : "bg-muted"}`}>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        Estado: {getStatusLabel(selectedOrder.status)}
                      </p>
                      <p className="text-sm text-muted-foreground">{getStatusMessage(selectedOrder.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NÚMERO DE PEDIDO</p>
                      <p className="font-mono font-bold text-primary">#{selectedOrder.id?.slice(-6)}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">HORA DE RECOGIDA</p>
                      <p className="text-sm text-foreground">{selectedOrder.pickupTime}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">ARTÍCULOS</p>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedOrder.specialInstructions && (
                      <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground mb-2">INSTRUCCIONES</p>
                        <p className="text-sm">{selectedOrder.specialInstructions}</p>
                      </div>
                    )}
                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm">${selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Impuesto</span>
                        <span className="text-sm">${selectedOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <Link href="/">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Hacer otro pedido
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Selecciona un pedido para ver los detalles</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}