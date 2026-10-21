"use client"

import { useState } from "react"
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react"
import { CAPTCHA_LABELS, type PublicChallenge } from "@/lib/bot-defense/captcha/types"
import { postJson } from "@/lib/secure-fetch"
import { MathCaptcha } from "./math-captcha"
import { TextCaptcha } from "./text-captcha"
import { SliderCaptcha } from "./slider-captcha"
import { ImagesCaptcha } from "./images-captcha"
import { CheckboxCaptcha } from "./checkbox-captcha"

export interface CaptchaProps<C extends PublicChallenge> {
  challenge: C
  busy: boolean
  submit: (answer: unknown) => void
}

interface CaptchaWidgetProps {
  challenge: PublicChallenge | null
  passed: boolean
  onPass: (pass: string) => void
  onChallenge: (challenge: PublicChallenge) => void
}

// Contenedor común: envía la respuesta a /api/captcha/verify. Si es correcta recibe un
// pase de un solo uso (que el formulario envía después); si no, muestra el reto nuevo.
export function CaptchaWidget({ challenge, passed, onPass, onChallenge }: CaptchaWidgetProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!challenge) return null

  const submit = async (answer: unknown) => {
    setBusy(true)
    setError("")
    try {
      const { res, data } = await postJson("/api/captcha/verify", { token: challenge.token, answer })
      if (res.ok && data.pass) {
        onPass(data.pass)
      } else {
        setError(res.status === 429 ? "Demasiados intentos, espera un momento" : data.error || "No se pudo verificar")
        if (data.challenge) onChallenge(data.challenge)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  const refresh = async () => {
    setBusy(true)
    setError("")
    try {
      const { data } = await postJson("/api/captcha", { type: challenge.type })
      if (data.challenge) onChallenge(data.challenge)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3 space-y-3"
      data-captcha-type={challenge.type}
      data-captcha-state={passed ? "passed" : "pending"}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Verificación de seguridad
          <span className="font-normal text-muted-foreground">· {CAPTCHA_LABELS[challenge.type]}</span>
        </p>
        {!passed && challenge.type !== "checkbox" && (
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Cambiar reto"
            title="Cambiar reto"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {passed ? (
        <p className="flex items-center gap-2 text-sm font-medium text-green-700" role="status">
          <CheckCircle2 className="h-5 w-5" /> Verificación completada
        </p>
      ) : (
        <div key={challenge.token}>
          {challenge.type === "math" && <MathCaptcha challenge={challenge} busy={busy} submit={submit} />}
          {challenge.type === "text" && <TextCaptcha challenge={challenge} busy={busy} submit={submit} />}
          {challenge.type === "slider" && <SliderCaptcha challenge={challenge} busy={busy} submit={submit} />}
          {challenge.type === "images" && <ImagesCaptcha challenge={challenge} busy={busy} submit={submit} />}
          {challenge.type === "checkbox" && <CheckboxCaptcha challenge={challenge} busy={busy} submit={submit} />}
        </div>
      )}

      {error && !passed && (
        <p className="text-sm text-red-700" role="alert" data-captcha-error>
          {error}
        </p>
      )}
    </div>
  )
}
