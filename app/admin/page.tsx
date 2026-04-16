"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { isAdmin } from "@/lib/admin-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { getAllOrders, archiveOrder, type Order } from "@/lib/orders-service"

type SortBy = "date" | "status" | "name"
type FilterStatus = "all" | "pending" | "preparing" | "ready" | "completed"

export default function AdminPage() {
  const { user, isLoaded, logout } = useAuth()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (isLoaded) {
        if (user) {
          const admin = await isAdmin(user.uid)
          setIsAdminUser(admin)
          if (admin) {
            setIsLoading(true)
            const data = await getAllOrders()
            setOrders(data)
            setIsLoading(false)
          }
        }
        setCheckingAdmin(false)
      }
    }
    checkAdmin()
  }, [user, isLoaded])

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus })
      const updated = orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      setOrders(updated)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
      alert("Error al actualizar el estado")
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm("¿Archivar este pedido? Seguirá visible en el historial del cliente.")) return
    try {
      await archiveOrder(orderId)
      setOrders(orders.filter((o) => o.id !== orderId))
      setSelectedOrder(null)
    } catch (error) {
      console.error("Error archivando pedido:", error)
      alert("Error al archivar el pedido")
    }
  }

  const filteredAndSortedOrders = orders
    .filter((o) => filterStatus === "all" || o.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case "date": return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "status": return a.status.localeCompare(b.status)
        case "name": return a.customer.name.localeCompare(b.customer.name)
        default: return 0
      }
    })

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

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Verificando acceso...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para acceder al panel.</p>
            <Link href="/login">
              <Button className="bg-primary text-primary-foreground">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Sin Acceso</h2>
            <p className="text-muted-foreground mb-6">No tienes permisos para acceder al panel.</p>
            <Link href="/">
              <Button variant="outline">Volver al Menú</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
            <h1 className="text-2xl font-bold text-primary">Panel de Administración</h1>
            <Button variant="outline" onClick={() => logout()}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pedidos Totales</p>
                <p className="text-3xl font-bold text-primary">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {orders.filter((o) => o.status === "pending").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">En Preparación</p>
                <p className="text-3xl font-bold text-blue-600">
                  {orders.filter((o) => o.status === "preparing").length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Listos</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter((o) => o.status === "ready").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                >
                  <option value="date">Fecha (Más Reciente)</option>
                  <option value="status">Estado</option>
                  <option value="name">Nombre Cliente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Filtrar por estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="preparing">En Preparación</option>
                  <option value="ready">Listos</option>
                  <option value="completed">Completados</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {filteredAndSortedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No hay pedidos para mostrar</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all ${selectedOrder?.id === order.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-card-foreground">{order.customer.name}</h3>
                            <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                              {getStatusIcon(order.status)}
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            #{order.id?.slice(-6)} • {new Date(order.date).toLocaleDateString("es-MX")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.items.length} artículos • ${order.total.toFixed(2)}
                          </p>
                        </div>
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="lg:col-span-1">
              {selectedOrder ? (
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Detalles del Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">NÚMERO DE PEDIDO</p>
                      <p className="font-mono font-bold text-primary">#{selectedOrder.id?.slice(-6)}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">CAMBIAR ESTADO</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["pending", "preparing", "ready", "completed"] as const).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={selectedOrder.status === status ? "default" : "outline"}
                            onClick={() => updateOrderStatus(selectedOrder.id!, status)}
                            className="w-full text-xs"
                          >
                            {getStatusLabel(status)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">CLIENTE</p>
                      <p className="font-medium text-foreground">{selectedOrder.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
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
                        <span>${selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Impuesto</span>
                        <span>${selectedOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => deleteOrder(selectedOrder.id!)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archivar Pedido
                    </Button>
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