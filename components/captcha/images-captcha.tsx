"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChallengeOf } from "@/lib/bot-defense/captcha/types"
import type { CaptchaProps } from "./captcha-widget"

// Reto 4: selección de imágenes (tipo reCAPTCHA v2) con fotos del menú. Las imágenes
// llegan por una URL opaca y alteradas al azar en cada reto.
export function ImagesCaptcha({ challenge, busy, submit }: CaptchaProps<ChallengeOf<"images">>) {
  const [selected, setSelected] = useState<number[]>([])
  const toggle = (i: number) => setSelected((s) => (s.includes(i) ? s.filter((v) => v !== i) : [...s, i]))

  return (
    <div className="space-y-2">
      <p className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{challenge.prompt}</p>
      <div className="grid grid-cols-3 gap-1.5 max-w-[300px]">
        {challenge.images.map((src, i) => {
          const on = selected.includes(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={on}
              aria-label={`Imagen ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded transition ${on ? "ring-4 ring-primary" : "hover:opacity-90"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} className={`h-full w-full object-cover transition ${on ? "scale-90" : ""}`} />
              {on && (
                <span className="absolute left-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <Button type="button" variant="secondary" onClick={() => submit(selected)} disabled={busy || selected.length === 0}>
        Verificar
      </Button>
    </div>
  )
}
