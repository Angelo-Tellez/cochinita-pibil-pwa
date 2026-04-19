import { db } from "./firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export interface UserProfile {
  uid: string
  name: string
  email: string
  phone: string
  provider: "email" | "google"
  createdAt: string
}

export async function createUserProfile(user: UserProfile): Promise<void> {
  await setDoc(doc(db, "users", user.uid), user)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid))
  if (!snapshot.exists()) return null
  return snapshot.data() as UserProfile
}

export async function updateUserPhone(uid: string, phone: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { phone }, { merge: true })
}