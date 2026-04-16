import { db } from "./firebase"
import { doc, getDoc } from "firebase/firestore"

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, "admins", userId)
    const snapshot = await getDoc(docRef)
    return snapshot.exists() && snapshot.data()?.role === "admin"
  } catch {
    return false
  }
}