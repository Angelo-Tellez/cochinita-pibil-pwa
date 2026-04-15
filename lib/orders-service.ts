import { db } from "./firebase"
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore"
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
}

export async function saveOrder(order: Omit<Order, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const q = query(collection(db, "orders"), where("userId", "==", userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
}

export async function getAllOrders(): Promise<Order[]> {
  const snapshot = await getDocs(collection(db, "orders"))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[]
}