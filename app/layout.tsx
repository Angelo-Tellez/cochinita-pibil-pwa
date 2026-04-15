import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ServiceWorkerRegister } from "./service-worker-register"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Updated metadata for Cochinita Pibil PWA app
export const metadata: Metadata = {
  title: "Porké - Comida Yucateca Auténtica",
  description: "Porké - Auténtica Cochinita Pibil y comida yucateca. Ordena para pickup sin esperar en fila.",
  generator: "v0.app",
  applicationName: "Porké",
  keywords: "porké, cochinita pibil, comida yucateca, pedidos, pickup, comida mexicana",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
}

// Added viewport configuration for PWA and mobile optimization
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Porké" />
      </head>
      <body className={`font-sans antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
