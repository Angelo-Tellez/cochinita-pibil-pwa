"use client"

import type React from "react"
import { useRef, useState } from "react"
import { ChevronsRight } from "lucide-react"
import type { ChallengeOf, TrailPoint } from "@/lib/bot-defense/captcha/types"
import type { CaptchaProps } from "./captcha-widget"

// Reto 3: puzzle deslizante. Se envía la posición final y la trayectoria del arrastre;
// el servidor revisa ambas (posición correcta Y movimiento humano).
export function SliderCaptcha({ challenge, busy, submit }: CaptchaProps<ChallengeOf<"slider">>) {
  const { width, height, pieceSize, pieceY } = challenge
  const maxX = width - pieceSize
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)
  const offset = useRef(0)
  const trail = useRef<TrailPoint[]>([])

  const point = (e: React.PointerEvent) => ({ x: Math.round(e.clientX * 10) / 10, y: Math.round(e.clientY * 10) / 10, t: Math.round(performance.now()) })

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busy || done) return
    e.currentTarget.setPointerCapture(e.pointerId)
    offset.current = e.clientX - x
    trail.current = [point(e)]
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setX(Math.min(maxX, Math.max(0, e.clientX - offset.current)))
    if (trail.current.length < 400) trail.current.push(point(e))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragging(false)
    trail.current.push(point(e))
    if (x < 4) return // un clic sin arrastrar no cuenta como intento
    setDone(true)
    submit({ x: Math.round(x), trail: trail.current })
  }

  return (
    <div className="space-y-2 select-none" style={{ width }}>
      <p className="text-sm text-muted-foreground">Arrastra la pieza hasta completar la imagen</p>
      <div className="relative overflow-hidden rounded border border-border" style={{ width, height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={challenge.background} alt="Imagen del puzzle" width={width} height={height} draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={challenge.piece}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute drop-shadow-[0_0_3px_rgba(0,0,0,0.6)]"
          style={{ left: x, top: pieceY, width: pieceSize, height: pieceSize }}
        />
      </div>
      <div className="relative h-10 rounded-full bg-muted border border-border" style={{ width }}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/20" style={{ width: x + pieceSize }} />
        <div
          role="slider"
          aria-label="Deslizar pieza del puzzle"
          aria-valuemin={0}
          aria-valuemax={maxX}
          aria-valuenow={Math.round(x)}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`absolute top-0 flex h-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ${busy || done ? "opacity-60" : "cursor-grab active:cursor-grabbing"}`}
          style={{ left: x, width: pieceSize, touchAction: "none" }}
        >
          <ChevronsRight className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
