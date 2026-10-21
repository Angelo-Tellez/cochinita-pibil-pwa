"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ClientSignals } from "@/lib/bot-defense/signals"
import type { PublicChallenge } from "@/lib/bot-defense/captcha/types"
import { postJson } from "@/lib/secure-fetch"

type VerifyResult = { ok: true; data: any } | { ok: false; error: string }

const MAX_SAMPLES = 30

// 1. Carga diferida: pide a /api/form-session los nombres de campo (aleatorios, generados
//    en el servidor), el token del formulario y, si aplica, el primer CAPTCHA.
// 2. Recolecta señales de interacción (mouse, teclado, clics, pegado, autocompletado).
// 3. En el submit envía todo, más el pase del CAPTCHA, a /api/verify-human (o al endpoint
//    del formulario) con el token CSRF.
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

  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [fieldNames, setFieldNames] = useState(() => Object.fromEntries(fields.map((f) => [f, ""])) as Record<K, string>)
  const [formToken, setFormToken] = useState("")
  const [honeypotName, setHoneypotName] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null)
  const [pass, setPass] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError("")
    try {
      const { res, data } = await postJson("/api/form-session", { form })
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el formulario")
      setFieldNames(data.fields)
      setHoneypotName(data.honeypot)
      setFormToken(data.formToken)
      setChallenge(data.challenge ?? null)
      setPass(null)
      start.current = performance.now()
      setReady(true)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el formulario")
    }
  }, [form])

  useEffect(() => {
    load()
  }, [load])

  // Señales a nivel de ventana
  useEffect(() => {
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

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("click", onClick)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("click", onClick)
    }
  }, [])

  // Señales del formulario: se enganchan cuando el formulario diferido ya existe en el DOM
  useEffect(() => {
    const formEl = formRef.current
    if (!ready || !formEl) return
    const s = stats.current
    const onPaste = () => { s.pastes++ }
    const onFocus = () => { s.focusChanges++ }
    // Autocompletado del navegador / gestor de contraseñas: el input llega sin inputType
    const onInput = (e: Event) => {
      const ie = e as InputEvent
      if (!ie.inputType || ie.inputType === "insertReplacementText") s.autofilled = true
    }
    formEl.addEventListener("paste", onPaste)
    formEl.addEventListener("focusin", onFocus)
    formEl.addEventListener("input", onInput)
    return () => {
      formEl.removeEventListener("paste", onPaste)
      formEl.removeEventListener("focusin", onFocus)
      formEl.removeEventListener("input", onInput)
    }
  }, [ready])

  // Traduce el name aleatorio de un input al nombre lógico del campo
  const fieldFromName = useCallback(
    (name: string) => (Object.keys(fieldNames) as K[]).find((k) => fieldNames[k] === name),
    [fieldNames],
  )

  const verify = useCallback(
    async (e: React.FormEvent, opts: { endpoint?: string; data?: object } = {}): Promise<VerifyResult> => {
      if (challenge && !pass) return { ok: false, error: "Completa la verificación de seguridad" }

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
        const { res, data } = await postJson(opts.endpoint ?? "/api/verify-human", {
          form,
          formToken,
          signals,
          captchaPass: pass ?? undefined,
          data: opts.data,
        })
        // El pase es de un solo uso, salvo que el servidor rechace antes de canjearlo (400 / 429)
        if (res.status === 400 || res.status === 429) return { ok: false, error: res.status === 429
          ? `Demasiados intentos. Intenta de nuevo en ${res.headers.get("Retry-After") ?? "unos"} segundos.`
          : data.error || "Revisa los datos del formulario" }
        setPass(null)

        if (res.ok && data.ok) {
          setChallenge(null)
          return { ok: true, data }
        }
        if (data.challenge) setChallenge(data.challenge)
        else if (pass) setChallenge(null)
        return { ok: false, error: data.error || "No pudimos verificar la solicitud" }
      } catch {
        return { ok: false, error: "Error de conexión al verificar la solicitud" }
      }
    },
    [form, formToken, honeypot, challenge, pass],
  )

  return {
    formRef,
    ready,
    loadError,
    reload: load,
    fieldNames,
    fieldFromName,
    verify,
    honeypotProps: {
      name: honeypotName,
      value: honeypot,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value),
    },
    captcha: {
      challenge,
      passed: !!pass,
      onPass: setPass,
      onChallenge: (c: PublicChallenge) => { setPass(null); setChallenge(c) },
    },
  }
}
