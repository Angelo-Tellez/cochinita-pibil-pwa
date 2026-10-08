"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import type { Challenge } from "@/hooks/use-human-check"

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

export function CaptchaField({ challenge, answer, setAnswer }: { challenge: Challenge | null; answer: string; setAnswer: (v: string) => void }) {
  if (!challenge) return null
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
      <label htmlFor="captcha-answer" className="block text-sm font-medium text-amber-900">
        Verificación de seguridad: {challenge.question}
      </label>
      <Input
        id="captcha-answer"
        inputMode="numeric"
        autoComplete="off"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Tu respuesta"
      />
    </div>
  )
}
