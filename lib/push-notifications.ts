import { getFirebaseMessaging } from "./firebase"
import { getToken, onMessage } from "firebase/messaging"
import { db } from "./firebase"
import { doc, setDoc } from "firebase/firestore"

export async function requestNotificationPermission(userId: string): Promise<boolean> {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return false

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return false

    // 👇 Agrega serviceWorkerRegistration para forzar token nuevo
    const registration = await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration  // 👈 esto fuerza regeneración
    })

    if (token) {
      console.log("Nuevo FCM token:", token) // 👈 para verificar en consola
      await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true })
      return true
    }
    return false
  } catch (error) {
    console.error("Error solicitando permisos:", error)
    return false
  }
}
//asdf
export async function onForegroundMessage(callback: (payload: any) => void) {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return
  onMessage(messaging, callback)
}