"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import type { ChallengeOf, TrailPoint } from "@/lib/bot-defense/captcha/types"
import type { CaptchaProps } from "./captcha-widget"

const MAX_TRAIL = 80

// Reto 5: casilla "No soy un robot". Mientras está visible se graba el recorrido del
// mouse; al hacer clic se envían esa trayectoria y event.isTrusted. Si el servidor ve
// un salto directo o una línea recta a velocidad constante, escala a otro reto.
export function CheckboxCaptcha({ busy, submit }: CaptchaProps<ChallengeOf<"checkbox">>) {
  const [checked, setChecked] = useState(false)
  const trail = useRef<TrailPoint[]>([])
  const touch = useRef(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      trail.current.push({ x: Math.round(e.clientX), y: Math.round(e.clientY), t: Math.round(performance.now()) })
      if (trail.current.length > MAX_TRAIL) trail.current.shift()
    }
    const onTouch = () => { touch.current = true }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("touchstart", onTouch)
    }
  }, [])

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy || checked) return
    setChecked(true)
    submit({
      trail: trail.current,
      trusted: e.nativeEvent.isTrusted,
      touch: touch.current,
      keyboard: e.detail === 0, // clic generado con Espacio / Enter
    })
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 shadow-sm max-w-[300px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onClick}
        className="flex items-center gap-3 text-sm font-medium text-foreground"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded border-2 border-muted-foreground/60 bg-background">
          {checked && busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </span>
        No soy un robot
      </button>
      <span className="text-[10px] leading-tight text-muted-foreground text-right">
        Porké
        <br />
        anti-bots
      </span>
    </div>
  )
}
