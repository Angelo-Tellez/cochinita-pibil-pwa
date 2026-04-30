"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react"
import { getProducts, type Product } from "@/lib/products-service"
import { Footer } from "@/components/footer"
import { User, LogOut, ShoppingCart, Settings, Plus, Minus } from "lucide-react"
export default function HomePage() {
  const { cart, addToCart, removeFromCart } = useCart()
  const { user, logout } = useAuth()
  const categories = ["Principales", "Sopas", "Acompañamientos", "Bebidas"]
  const [menuItems, setMenuItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts().then((products) => {
      setMenuItems(products)
      setLoading(false)
    })
  }, [])

  const productsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = menuItems.filter((item) => item.category === category)
      return acc
    },
    {} as Record<string, Product[]>,
  )

  const cartTotal = cart.reduce((total, cartItem) => {
    return total + cartItem.price * cartItem.quantity
  }, 0)

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0)

  // ← NUEVO: pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Cargando menú...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <img
                src="/porke-logo.png"
                alt="Porké Logo"
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">Porké</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Comida Yucateca Auténtica</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-2 sm:pr-0">
              {user ? (
                <>
                  <Link href="/my-orders">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent hidden sm:flex">
                      <User className="h-4 w-4" />
                      <span>Mis Pedidos</span>
                    </Button>
                    <Button variant="outline" size="icon" className="bg-transparent sm:hidden">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent hidden sm:flex">
                      <Settings className="h-4 w-4" />
                      <span>Perfil</span>
                    </Button>
                    <Button variant="outline" size="icon" className="bg-transparent sm:hidden">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="gap-2 text-muted-foreground hover:text-foreground hidden sm:flex"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Salir</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-muted-foreground hover:text-foreground sm:hidden"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-muted-foreground hover:text-foreground sm:hidden"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm" variant="outline" className="gap-2 bg-transparent hidden sm:flex">
                    <User className="h-4 w-4" />
                    <span>Iniciar Sesión</span>
                  </Button>
                  <Button size="icon" variant="outline" className="gap-2 bg-transparent sm:hidden">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/cart">
                <Button size="lg" className="relative gap-2 bg-primary hover:bg-primary/90 hidden sm:flex">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Carrito</span>
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
                {/* Solo ícono en móviles */}
                <Button size="icon" className="relative bg-primary hover:bg-primary/90 sm:hidden">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        {categories.map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-6 pb-3 border-b-2 border-primary">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsByCategory[category].map((item) => (
                <Link key={item.id} href={`/products/${item.id}`}>
                  <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer h-full">
                    <CardContent className="p-0">
                      <div className="relative h-40 overflow-hidden bg-muted">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                      <div className="flex flex-col justify-between p-4">
                        <div>
                          <h3 className="font-semibold text-card-foreground line-clamp-2">{item.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        </div>
                        <div className="mt-4 flex items-end justify-between">
                          <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                          <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                            {cart.find((c) => c.id === item.id) ? (
                              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted">
                                <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-primary/10">
                                  <Minus className="h-4 w-4 text-primary" />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold">
                                  {cart.find((c) => c.id === item.id)?.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })
                                  }
                                  className="p-1 hover:bg-primary/10"
                                >
                                  <Plus className="h-4 w-4 text-primary" />
                                </button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })
                                }
                                className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Agregar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Floating Cart Summary - Mobile only */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 shadow-lg md:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{cartCount} artículos</p>
                <p className="text-lg font-bold text-primary">${cartTotal.toFixed(2)}</p>
              </div>
              <Link href="/cart">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ShoppingCart className="h-5 w-5" />
                  Ver Carrito
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
