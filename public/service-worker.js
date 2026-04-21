importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBRxIhfAR8_adpoHGQjQTLdEe4pD9xiJ1U",
  authDomain: "cochinita-pibil-pwa.firebaseapp.com",
  projectId: "cochinita-pibil-pwa",
  storageBucket: "cochinita-pibil-pwa.firebasestorage.app",
  messagingSenderId: "804769287417",
  appId: "1:804769287417:web:9cfbd3df8cb92874ff6628"
})

const messaging = firebase.messaging()

// Manejar notificaciones en background
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/porke-logo.png',
    badge: '/porke-logo.png',
    vibrate: [200, 100, 200],
  })
})

// Cache
const CACHE_NAME = "cochinita-pibil-v1"
const urlsToCache = ["/", "/app.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return response
      }).catch(() => new Response("Offline", { status: 503 }))
    })
  )
})