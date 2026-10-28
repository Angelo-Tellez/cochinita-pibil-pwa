"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PublicChallenge } from "@/lib/bot-defense/captcha/types"
import { postJson } from "@/lib/secure-fetch"
import { CaptchaWidget } from "./captcha-widget"

interface PuzzleGateProps {
  // Se invoca con el pase de un solo uso cuando el rompecabezas se resuelve en el servidor
  onVerified: (pass: string) => void
  // Se invoca si el pase deja de ser válido y hay que volver a resolver
  onReset?: () => void
}

// Candado de rompecabezas (slider) para proteger acciones sensibles (p. ej. "Proceder al
// pago"). Pide el reto a /api/captcha forzando el tipo "slider"; el widget verifica la
// respuesta en /api/captcha/verify, donde el servidor comprueba la posición final Y la
// trayectoria del arrastre. Un bot que solo hace clic no obtiene un pase válido.
export function PuzzleGate({ onVerified, onReset }: PuzzleGateProps) {
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null)
  const [passed, setPassed] = useState(false)
  const [loadError, setLoadError] = useState("")

  // Guardamos los callbacks en refs: así `load` mantiene identidad estable y el efecto
  // no vuelve a disparar peticiones aunque el padre pase funciones nuevas en cada render.
  const onResetRef = useRef(onReset)
  onResetRef.current = onReset

  const load = useCallback(async () => {
    setLoadError("")
    try {
      const { data } = await postJson("/api/captcha", { only: "slider" })
      if (!data.challenge) throw new Error("No se pudo cargar la verificación")
      setChallenge(data.challenge)
      setPassed(false)
      onResetRef.current?.()
    } catch {
      setLoadError("No se pudo cargar la verificación de seguridad")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-2" data-puzzle-gate={passed ? "passed" : "pending"}>
      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {loadError}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      ) : (
        <CaptchaWidget
          challenge={challenge}
          passed={passed}
          onPass={(pass) => {
            setPassed(true)
            onVerified(pass)
          }}
          onChallenge={(c) => {
            setPassed(false)
            setChallenge(c)
          }}
        />
      )}
    </div>
  )
}
