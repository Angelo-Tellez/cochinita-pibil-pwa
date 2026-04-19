"use client"

import { useState, useEffect } from "react"
import { auth, googleProvider } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  reload,
  type User,
} from "firebase/auth"
import { createUserProfile, getUserProfile} from "@/lib/users-service"
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

  
  const register = async (email: string, password: string, name: string, phone: string = "") => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: name })
      await sendEmailVerification(credential.user)

      // Guardamos temporalmente el teléfono y nombre en localStorage
      // para usarlos cuando verifique el correo
      localStorage.setItem("pending-profile", JSON.stringify({ name, phone }))

      return { success: true, needsVerification: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const checkEmailVerified = async () => {
    if (!auth.currentUser) return false
    await reload(auth.currentUser)
    
    if (auth.currentUser.emailVerified) {
      const pending = localStorage.getItem("pending-profile")
      if (pending) {
        const { name, phone } = JSON.parse(pending)
        await createUserProfile({
          uid: auth.currentUser.uid,
          name: auth.currentUser.displayName || name,
          email: auth.currentUser.email || "",
          phone,
          provider: "email",
          createdAt: new Date().toISOString(),
        })
        localStorage.removeItem("pending-profile")
      }
      return true
    }
    return false
  }

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      
      if (!credential.user.emailVerified) {
        await signOut(auth)
        return { 
          success: false, 
          error: "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." 
        }
      }

      setUser(credential.user)
      return { success: true, user: credential.user }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

 

  const loginWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider)
      
      // ← NUEVO: solo crea el perfil si es nuevo usuario
      const existing = await getUserProfile(credential.user.uid)
      if (!existing) {
        await createUserProfile({
          uid: credential.user.uid,
          name: credential.user.displayName || "",
          email: credential.user.email || "",
          phone: "",
          provider: "google",
          createdAt: new Date().toISOString(),
        })
      }

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
  loginWithGoogle,
  logout,
  checkEmailVerified,
  isAuthenticated: !!user,
}
}