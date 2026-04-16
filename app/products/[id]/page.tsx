"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { getProductById, type Product } from "@/lib/products-service"
import { Footer } from "@/components/footer"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const { addToCart, cart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductById(productId).then((data) => {
      setProduct(data)
      setLoading(false)
    })
  }, [productId])

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addToCart({ id: product.id, name: product.name, price: product.price, image: product.image })
    }
    setQuantity(1)
  }

  const existingItem = cart.find((c) => c.id === productId)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando producto...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Producto no encontrado</h1>
          <Link href="/">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <ArrowLeft className="h-4 w-4" />
              Volver al menú
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Detalles del Producto</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex items-center justify-center">
            <Card className="w-full overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </Card>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{product.name}</h2>
              <p className="text-muted-foreground mb-6">{product.description}</p>

              <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground mb-1">Precio</p>
                <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Detalles del Producto</p>
                  <p className="text-foreground">{product.details}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Calorías</p>
                    <p className="text-lg font-semibold text-primary">{product.calories} cal</p>
                  </div>
                  <div className="p-4 bg-card border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Porción</p>
                    <p className="text-lg font-semibold text-primary">{product.portion}</p>
                  </div>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Ingredientes</p>
                  <p className="text-foreground">{product.ingredients}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Cantidad:</span>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-primary/10">
                    <Minus className="h-4 w-4 text-primary" />
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-primary/10">
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {existingItem ? `Agregar ${quantity} más` : "Agregar al Carrito"}
              </Button>

              {existingItem && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Ya tienes <span className="font-semibold text-primary">{existingItem.quantity}</span> de este
                    producto en el carrito
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}