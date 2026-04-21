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

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration("/service-worker.js"),
    })

    if (token) {
      // Guardar token en Firestore
      await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true })
      return true
    }
    return false
  } catch (error) {
    console.error("Error solicitando permisos:", error)
    return false
  }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return
  onMessage(messaging, callback)
}