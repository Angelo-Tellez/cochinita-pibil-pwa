import { db } from "./firebase"
import { collection, getDocs, doc as firestoreDoc, getDoc, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore"

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

export async function getProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), where("available", "==", true))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({
    ...d.data(),   // ← primero los datos
    id: d.id,      // ← luego el ID de Firestore (sobreescribe el numérico)
  })) as Product[]
}

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, "products"))
  return snapshot.docs.map((d) => ({
    ...d.data(),
    id: d.id,      // ← mismo fix
  })) as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const docRef = firestoreDoc(db, "products", id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Product
}

export async function createProduct(product: Omit<Product, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "products"), product)
  return docRef.id
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<void> {
  await updateDoc(firestoreDoc(db, "products", id), data)
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(firestoreDoc(db, "products", id))
}