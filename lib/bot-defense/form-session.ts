import crypto from "crypto"
import { seal, unseal } from "./keys"
import type { CaptchaType } from "./captcha/types"

// Formularios con carga diferida: el HTML inicial no trae los campos. El cliente los
// pide por fetch a /api/form-session y recibe nombres de campo aleatorios generados
// en el servidor + un token cifrado con la hora de emisión. Así el servidor mide el
// tiempo real de llenado (no se puede falsificar desde el cliente) y una petición
// directa a la API sin haber cargado el formulario se detecta.

export interface FormPolicy {
  captcha: "risk" | "always"
  // Tipos de reto que el servidor muestra para este formulario
  challengeTypes: readonly CaptchaType[]
  // Pases aceptados: impide resolver el reto más fácil y usarlo en otro formulario
  acceptedPasses: readonly CaptchaType[]
  fields: readonly string[]
}

const STRONG: CaptchaType[] = ["math", "text", "slider", "images"]

export const FORM_POLICIES: Record<string, FormPolicy> = {
  // Login: CAPTCHA sólo si la puntuación de riesgo lo pide
  login: { captcha: "risk", challengeTypes: STRONG, acceptedPasses: STRONG, fields: ["email", "password"] },
  // Registro: siempre (crear cuentas en masa es el abuso más común)
  register: { captcha: "always", challengeTypes: ["text", "slider", "images"], acceptedPasses: STRONG, fields: ["name", "email", "phone", "password", "confirmPassword"] },
  // Contacto: casilla "No soy un robot"; si el movimiento parece de bot, escala a otro reto
  contact: { captcha: "always", challengeTypes: ["checkbox"], acceptedPasses: ["checkbox", ...STRONG], fields: ["name", "email", "subject", "message"] },
}

const FORM_TTL_MS = 2 * 60 * 60_000 // 2 horas con el formulario abierto

interface SealedForm {
  k: "form"
  sid: string
  form: string
  iat: number
  hp: string
}

const suffix = () => crypto.randomBytes(4).toString("hex")

export function issueFormSession(sessionId: string, form: string) {
  const policy = FORM_POLICIES[form]
  const fields = Object.fromEntries(policy.fields.map((f) => [f, `${f.slice(0, 2)}_${suffix()}${suffix()}`]))
  const honeypot = `url_${suffix()}`
  const formToken = seal({ k: "form", sid: sessionId, form, iat: Date.now(), hp: honeypot } satisfies SealedForm)
  return { formToken, fields, honeypot }
}

export function readFormToken(token: unknown, sessionId: string, form: string) {
  const t = unseal<SealedForm>(token)
  if (!t || t.k !== "form" || t.sid !== sessionId || t.form !== form) return null
  if (Date.now() - t.iat > FORM_TTL_MS) return null
  return { elapsedMs: Date.now() - t.iat }
}
