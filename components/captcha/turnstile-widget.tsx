"use client"

import { useEffect, useRef } from "react"

// Widget de Cloudflare Turnstile. Carga el script oficial y renderiza el reto de forma
// explícita. Entrega un token al resolverse; ese token se verifica en el servidor
// (/api/turnstile/verify) contra la API de Cloudflare antes de permitir el login.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  onExpire?: () => void
  // Cada vez que cambia este número, el reto se reinicia (p. ej. tras un intento fallido)
  resetSignal?: number
}

export function TurnstileWidget({ onToken, onExpire, resetSignal = 0 }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  // Callbacks en refs para que el efecto de montaje no dependa de su identidad
  const onTokenRef = useRef(onToken)
  const onExpireRef = useRef(onExpire)
  onTokenRef.current = onToken
  onExpireRef.current = onExpire

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.warn("[turnstile] Falta NEXT_PUBLIC_TURNSTILE_SITE_KEY")
      return
    }

    let cancelled = false
    let poll: ReturnType<typeof setInterval> | null = null

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onExpireRef.current?.(),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      if (!document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) {
        const s = document.createElement("script")
        s.src = SCRIPT_SRC
        s.async = true
        s.defer = true
        document.head.appendChild(s)
      }
      poll = setInterval(() => {
        if (window.turnstile) {
          if (poll) clearInterval(poll)
          render()
        }
      }, 200)
    }

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current) } catch {}
        widgetId.current = null
      }
    }
  }, [])

  // Reinicia el reto cuando el padre lo pide (token de un solo uso ya consumido)
  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      try { window.turnstile.reset(widgetId.current) } catch {}
    }
  }, [resetSignal])

  return <div ref={ref} className="flex justify-center" />
}
