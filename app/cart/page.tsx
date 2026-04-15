"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function CartPage() {
  const { cart, isLoaded, updateCartQuantity, removeFromCart, clearCart } = useCart()
  const [showConfirm, setShowConfirm] = useState(false)

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.085
  const total = subtotal + tax

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando carrito...</p>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Volver al Menú
              </Button>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <h2 className="mb-4 text-2xl font-bold text-card-foreground">Carrito Vacío</h2>
              <p className="mb-8 text-muted-foreground">
                No hay artículos en tu carrito. Agrega algo delicioso del menú.
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
        <h1 className="text-3xl font-bold text-foreground">Tu Carrito</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                      <p className="mt-2 text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-primary/10"
                        >
                          <Minus className="h-4 w-4 text-primary" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-primary/10"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-card-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Link href="/checkout" className="block">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Proceder al Checkout
                  </Button>
                </Link>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowConfirm(true)}>
                  Vaciar Carrito
                </Button>
                {showConfirm && (
                  <div className="rounded-lg border border-destructive bg-destructive/5 p-3">
                    <p className="mb-2 text-sm text-destructive">¿Estás seguro de que deseas vaciar el carrito?</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => { clearCart(); setShowConfirm(false) }}>
                        Vaciar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}