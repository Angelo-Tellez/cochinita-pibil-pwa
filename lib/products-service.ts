import { db } from "./firebase"
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  calories: number
  portion: string
  ingredients: string
  details: string
  available: boolean
}

// Obtener todos los productos disponibles
export async function getProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), where("available", "==", true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[]
}

// Obtener un producto por su ID de Firestore
export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, "products", id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Product
}