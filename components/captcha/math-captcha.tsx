"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ChallengeOf } from "@/lib/bot-defense/captcha/types"
import type { CaptchaProps } from "./captcha-widget"

// Reto 1: operación aritmética. La respuesta nunca viaja al navegador.
export function MathCaptcha({ challenge, busy, submit }: CaptchaProps<ChallengeOf<"math">>) {
  const [answer, setAnswer] = useState("")
  const send = () => answer.trim() && submit(answer.trim())

  return (
    <div className="space-y-2">
      <label htmlFor="captcha-answer" className="block text-sm text-foreground">
        {challenge.question}
      </label>
      <div className="flex gap-2">
        <Input
          id="captcha-answer"
          inputMode="numeric"
          autoComplete="off"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send() } }}
          placeholder="Tu respuesta"
        />
        <Button type="button" variant="secondary" onClick={send} disabled={busy || !answer.trim()}>
          Verificar
        </Button>
      </div>
    </div>
  )
}
