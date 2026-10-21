"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export { CaptchaWidget } from "@/components/captcha/captcha-widget"

// Campo trampa: invisible para personas (fuera de pantalla, sin tabulación, oculto a
// lectores de pantalla), pero un bot que llena todos los inputs lo completará.
export function Honeypot(props: { name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Sitio web
        <input type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  )
}

// Marcador mientras el formulario se pide al servidor (carga diferida)
export function FormSkeleton({ fields, error, onRetry }: { fields: number; error?: string; onRetry?: () => void }) {
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
        {error}{" "}
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-semibold underline">
            Reintentar
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando formulario">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
