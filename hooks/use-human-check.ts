"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ClientSignals } from "@/lib/bot-defense/signals"

export interface Challenge {
  question: string
  token: string
}

type VerifyResult = { ok: true } | { ok: false; error: string }

const MAX_SAMPLES = 30

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

// Recolecta señales de interacción del formulario y las envía a /api/verify-human.
// `fieldNames` genera atributos name/id que cambian en cada carga para que un script
// no pueda depender de selectores fijos como By.NAME("email").
export function useHumanCheck<K extends string>(form: string, fields: readonly K[]) {
  const formRef = useRef<HTMLFormElement>(null)
  const start = useRef(0)
  const stats = useRef({
    mouseMoves: 0,
    keyDowns: 0,
    pastes: 0,
    focusChanges: 0,
    autofilled: false,
    touch: false,
    clickIntervals: [] as number[],
    keyIntervals: [] as number[],
    lastClick: 0,
    lastKey: 0,
  })

  const [fieldNames, setFieldNames] = useState(() => Object.fromEntries(fields.map((f) => [f, f as string])) as Record<K, string>)
  const [honeypotName, setHoneypotName] = useState("website")
  const [honeypot, setHoneypot] = useState("")
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  useEffect(() => {
    // Se genera tras el montaje para no provocar errores de hidratación
    const suffix = randomSuffix()
    setFieldNames(Object.fromEntries(fields.map((f) => [f, `${f.slice(0, 2)}_${suffix}_${randomSuffix()}`])) as Record<K, string>)
    setHoneypotName(`url_${randomSuffix()}`)
    start.current = performance.now()

    const s = stats.current
    const push = (arr: number[], v: number) => { arr.push(Math.round(v)); if (arr.length > MAX_SAMPLES) arr.shift() }

    const onPointerMove = (e: PointerEvent) => { if (e.pointerType === "mouse") s.mouseMoves++ }
    const onTouch = () => { s.touch = true }
    const onKeyDown = () => {
      const now = performance.now()
      if (s.lastKey) push(s.keyIntervals, now - s.lastKey)
      s.lastKey = now
      s.keyDowns++
    }
    const onClick = () => {
      const now = performance.now()
      if (s.lastClick) push(s.clickIntervals, now - s.lastClick)
      s.lastClick = now
    }
    const onPaste = () => { s.pastes++ }
    const onFocus = () => { s.focusChanges++ }
    // Autocompletado del navegador / gestor de contraseñas: el input llega sin inputType
    const onInput = (e: Event) => {
      const ie = e as InputEvent
      if (!ie.inputType || ie.inputType === "insertReplacementText") s.autofilled = true
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("click", onClick)
    const formEl = formRef.current
    formEl?.addEventListener("paste", onPaste)
    formEl?.addEventListener("focusin", onFocus)
    formEl?.addEventListener("input", onInput)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("click", onClick)
      formEl?.removeEventListener("paste", onPaste)
      formEl?.removeEventListener("focusin", onFocus)
      formEl?.removeEventListener("input", onInput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Traduce el name aleatorio de un input al nombre lógico del campo
  const fieldFromName = useCallback(
    (name: string) => (Object.keys(fieldNames) as K[]).find((k) => fieldNames[k] === name),
    [fieldNames],
  )

  const verify = useCallback(
    async (e: React.FormEvent): Promise<VerifyResult> => {
      const s = stats.current
      const signals: ClientSignals = {
        elapsedMs: Math.round(performance.now() - start.current),
        mouseMoves: s.mouseMoves,
        keyDowns: s.keyDowns,
        pastes: s.pastes,
        autofilled: s.autofilled,
        focusChanges: s.focusChanges,
        clickIntervals: s.clickIntervals,
        keyIntervals: s.keyIntervals,
        touch: s.touch || navigator.maxTouchPoints > 0,
        webdriver: navigator.webdriver === true,
        submitTrusted: e.nativeEvent.isTrusted,
        honeypot,
      }

      try {
        const res = await fetch("/api/verify-human", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form,
            signals,
            captcha: challenge ? { token: challenge.token, answer: captchaAnswer } : undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok && data.ok) {
          setChallenge(null)
          setCaptchaAnswer("")
          return { ok: true }
        }
        if (res.status === 429) {
          return { ok: false, error: `Demasiados intentos. Intenta de nuevo en ${res.headers.get("Retry-After") ?? "unos"} segundos.` }
        }
        if (data.requireCaptcha && data.challenge) {
          setChallenge(data.challenge)
          setCaptchaAnswer("")
        }
        return { ok: false, error: data.error || "No pudimos verificar la solicitud" }
      } catch {
        return { ok: false, error: "Error de conexión al verificar la solicitud" }
      }
    },
    [form, honeypot, challenge, captchaAnswer],
  )

  return {
    formRef,
    fieldNames,
    fieldFromName,
    verify,
    honeypotProps: {
      name: honeypotName,
      value: honeypot,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value),
    },
    captcha: { challenge, answer: captchaAnswer, setAnswer: setCaptchaAnswer },
  }
}
