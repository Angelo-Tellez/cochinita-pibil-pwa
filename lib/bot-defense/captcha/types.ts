// Tipos compartidos entre cliente y servidor (sin dependencias de Node).

export const CAPTCHA_TYPES = ["math", "text", "slider", "images", "checkbox"] as const
export type CaptchaType = (typeof CAPTCHA_TYPES)[number]

export const CAPTCHA_LABELS: Record<CaptchaType, string> = {
  math: "Operación aritmética",
  text: "Texto distorsionado",
  slider: "Puzzle deslizante",
  images: "Selección de imágenes",
  checkbox: "No soy un robot",
}

export interface TrailPoint {
  x: number
  y: number
  t: number
}

export type PublicChallenge =
  | { type: "math"; token: string; question: string }
  | { type: "text"; token: string; image: string }
  | {
      type: "slider"
      token: string
      background: string
      piece: string
      pieceY: number
      pieceSize: number
      width: number
      height: number
    }
  | { type: "images"; token: string; prompt: string; images: string[] }
  | { type: "checkbox"; token: string }

export type ChallengeOf<T extends CaptchaType> = Extract<PublicChallenge, { type: T }>
