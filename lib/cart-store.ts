export interface CartItem {
  id: string  // ← cambió de number a string
  quantity: number
  name: string
  price: number
  image: string
}

const CART_STORAGE_KEY = "cochinita-cart"

export const cartStore = {
  getCart: (): CartItem[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  setCart: (cart: CartItem[]) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      console.error("Failed to save cart to localStorage")
    }
  },

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const cart = cartStore.getCart()
    const existing = cart.find((cartItem) => cartItem.id === item.id)
    if (existing) {
      existing.quantity += item.quantity || 1
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 })
    }
    cartStore.setCart(cart)
    return cart
  },

  removeItem: (id: string) => {  // ← cambió de number a string
    let cart = cartStore.getCart()
    cart = cart
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0)
    cartStore.setCart(cart)
    return cart
  },

  clearCart: () => {
    cartStore.setCart([])
  },

  updateQuantity: (id: string, quantity: number) => {  // ← cambió de number a string
    let cart = cartStore.getCart()
    if (quantity <= 0) {
      cart = cart.filter((item) => item.id !== id)
    } else {
      const item = cart.find((i) => i.id === id)
      if (item) item.quantity = quantity
    }
    cartStore.setCart(cart)
    return cart
  },
}