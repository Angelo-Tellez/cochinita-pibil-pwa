"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChallengeOf } from "@/lib/bot-defense/captcha/types"
import type { CaptchaProps } from "./captcha-widget"

// Reto 2: texto distorsionado generado como imagen en el servidor.
export function TextCaptcha({ challenge, busy, submit }: CaptchaProps<ChallengeOf<"text">>) {
  const [answer, setAnswer] = useState("")
  const send = () => answer.trim() && submit(answer.trim())

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={challenge.image} alt="Código de verificación" width={220} height={72} className="rounded border border-border select-none" draggable={false} />
      <label htmlFor="captcha-text" className="block text-sm text-muted-foreground">
        Escribe los caracteres de la imagen (no distingue mayúsculas)
      </label>
      <div className="flex gap-2">
        <Input
          id="captcha-text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={8}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send() } }}
          placeholder="ABC12"
        />
        <Button type="button" variant="secondary" onClick={send} disabled={busy || !answer.trim()}>
          Verificar
        </Button>
      </div>
    </div>
  )
}
