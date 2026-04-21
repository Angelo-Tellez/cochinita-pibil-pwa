importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyBRxIhfAR8_adpoHGQjQTLdEe4pD9xiJ1U",
  authDomain: "cochinita-pibil-pwa.firebaseapp.com",
  projectId: "cochinita-pibil-pwa",
  storageBucket: "cochinita-pibil-pwa.firebasestorage.app",
  messagingSenderId: "804769287417",
  appId: "1:804769287417:web:9cfbd3df8cb92874ff6628"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
  })
})