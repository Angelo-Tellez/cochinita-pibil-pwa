import { db } from "./firebase"
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import type { CartItem } from "./cart-store"

export interface Order {
  id?: string
  userId: string
  date: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  pickupTime: string
  specialInstructions: string
  status: "pending" | "preparing" | "ready" | "completed"
  createdAt?: any
}

export async function saveOrder(order: Omit<Order, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")  // ← más reciente primero
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
  } catch (error) {
    // Si no existe el índice aún, cae aquí sin romper la app
    const q = query(collection(db, "orders"), where("userId", "==", userId))
    const snapshot = await getDocs(q)
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
  } catch (error) {
    const snapshot = await getDocs(collection(db, "orders"))
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}