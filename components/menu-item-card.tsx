"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"

interface MenuItemCardProps {
  id: number
  name: string
  description: string
  price: number
  image: string
  quantity?: number
  onAddToCart: (id: number) => void
  onRemoveFromCart: (id: number) => void
}

export function MenuItemCard({
  id,
  name,
  description,
  price,
  image,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
}: MenuItemCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative h-40 overflow-hidden bg-muted">
          <img src={image || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-between p-4">
          <div>
            <h3 className="font-semibold text-card-foreground line-clamp-2">{name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
            {quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted">
                <button onClick={() => onRemoveFromCart(id)} className="p-1 hover:bg-primary/10">
                  <Minus className="h-4 w-4 text-primary" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => onAddToCart(id)} className="p-1 hover:bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => onAddToCart(id)}
                className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
