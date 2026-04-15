"use client"

import { useState, useEffect } from "react"
import { cartStore, type CartItem } from "@/lib/cart-store"

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = cartStore.getCart()
    setCart(storedCart)
    setIsLoaded(true)
  }, [])

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    const updated = cartStore.addItem(product)
    setCart(updated)
  }

  const removeFromCart = (id: string) => {
    const updated = cartStore.removeItem(id)
    setCart(updated)
  }

  const updateCartQuantity = (id: string, quantity: number) => {
    const updated = cartStore.updateQuantity(id, quantity)
    setCart(updated)
  }

  const clearCart = () => {
    cartStore.clearCart()
    setCart([])
  }

  return {
    cart,
    isLoaded,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  }
}
