"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth"

export type { User }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Escucha cambios de sesión automáticamente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoaded(true)
    })
    return () => unsubscribe()
  }, [])

  const register = async (email: string, password: string, name: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: name })
      setUser({ ...credential.user, displayName: name })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      setUser(credential.user)
      return { success: true, user: credential.user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return {
    user,
    isLoaded,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  }
}