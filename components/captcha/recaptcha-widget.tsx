"use client"

import { useEffect, useRef, useState } from "react"

// Widget de Google reCAPTCHA v2 ("No soy un robot"). Carga el script oficial y renderiza
// el reto de forma explícita. Entrega un token al resolverse; ese token se verifica en el
// servidor (/api/recaptcha/verify) contra la API de Google antes de permitir el login.

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => number
      reset: (id?: number) => void
    }
  }
}

const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit"

interface RecaptchaWidgetProps {
  onToken: (token: string) => void
  onExpire?: () => void
  // Cada vez que cambia este número, el reto se reinicia (p. ej. tras un intento fallido)
  resetSignal?: number
}

export function RecaptchaWidget({ onToken, onExpire, resetSignal = 0 }: RecaptchaWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  // Callbacks en refs para que el efecto de montaje no dependa de su identidad
  const onTokenRef = useRef(onToken)
  const onExpireRef = useRef(onExpire)
  onTokenRef.current = onToken
  onExpireRef.current = onExpire

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!siteKey) {
      setStatus("error")
      setErrorMsg("Falta configurar la verificación de seguridad (NEXT_PUBLIC_RECAPTCHA_SITE_KEY).")
      return
    }

    let cancelled = false
    let poll: ReturnType<typeof setInterval> | null = null
    // Si el script no carga en 8 s (red, bloqueador o escudos del navegador), avisamos
    const timeout = setTimeout(() => {
      if (!cancelled && widgetId.current === null) {
        setStatus("error")
        setErrorMsg("No se pudo cargar la verificación. Revisa tu conexión o desactiva el bloqueador/escudo del navegador.")
      }
    }, 8000)

    const ready = () => !!(window.grecaptcha && typeof window.grecaptcha.render === "function")

    const render = () => {
      if (cancelled || !ref.current || !ready() || widgetId.current !== null) return
      widgetId.current = window.grecaptcha!.render(ref.current, {
        sitekey: siteKey,
        callback: (token: string) => { setStatus("ready"); onTokenRef.current(token) },
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onExpireRef.current?.(),
      })
      setStatus("ready")
    }

    if (ready()) {
      render()
    } else {
      if (!document.querySelector(`script[src^="https://www.google.com/recaptcha/api.js"]`)) {
        const s = document.createElement("script")
        s.src = SCRIPT_SRC
        s.async = true
        s.defer = true
        s.onerror = () => {
          setStatus("error")
          setErrorMsg("No se pudo cargar la verificación. Revisa tu conexión o desactiva el bloqueador/escudo del navegador.")
        }
        document.head.appendChild(s)
      }
      poll = setInterval(() => {
        if (ready()) {
          if (poll) clearInterval(poll)
          render()
        }
      }, 200)
    }

    return () => {
      cancelled = true
      clearTimeout(timeout)
      if (poll) clearInterval(poll)
    }
  }, [])

  // Reinicia el reto cuando el padre lo pide (token de un solo uso ya consumido)
  useEffect(() => {
    if (resetSignal > 0 && widgetId.current !== null && window.grecaptcha) {
      try { window.grecaptcha.reset(widgetId.current) } catch {}
    }
  }, [resetSignal])

  return (
    <div className="space-y-1">
      <div ref={ref} className="flex justify-center" />
      {status === "loading" && (
        <p className="text-center text-xs text-muted-foreground">Cargando verificación de seguridad…</p>
      )}
      {status === "error" && (
        <p className="text-center text-xs text-red-600" role="alert">{errorMsg}</p>
      )}
    </div>
  )
}
