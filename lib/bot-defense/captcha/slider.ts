import crypto from "crypto"
import { ALL_PHOTOS, photoPath } from "./images"
import type { TrailPoint } from "./types"
import { analyzeTrail, sanitizeTrail, type TrailAnalysis } from "./trail"

// Puzzle deslizante: se recorta una pieza de una foto del menú y se oscurece el hueco.
// Las dos imágenes se rasterizan en el servidor con sharp, así que la posición del
// hueco sólo existe como píxeles: no aparece en el DOM ni en el CSS.

export const SLIDER = { width: 280, height: 160, piece: 56 }
const TOLERANCE_PX = 6

// Pieza de 44×44 con una pestaña arriba y otra a la derecha, dentro de una caja de 56×56
const PIECE_PATH = "M0 12 H13 A9 9 0 0 1 31 12 H44 V25 A9 9 0 0 1 44 43 V56 H0 Z"

function pieceSvg(fill: string, stroke: string) {
  const s = SLIDER.piece
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><path d="${PIECE_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="2"/></svg>`,
  )
}

export async function createSliderChallenge() {
  const sharp = (await import("sharp")).default
  const { width: W, height: H, piece: S } = SLIDER

  const x = crypto.randomInt(S + 30, W - S - 8)
  const y = crypto.randomInt(8, H - S - 8)
  const photo = ALL_PHOTOS[crypto.randomInt(0, ALL_PHOTOS.length)]

  const base = await sharp(photoPath(photo))
    .resize(W, H, { fit: "cover" })
    .modulate({ brightness: 0.9 + Math.random() * 0.2, hue: crypto.randomInt(-15, 16) })
    .png()
    .toBuffer()

  const piece = await sharp(base)
    .extract({ left: x, top: y, width: S, height: S })
    .composite([
      { input: pieceSvg("#fff", "none"), blend: "dest-in" },
      { input: pieceSvg("none", "rgba(255,255,255,0.95)") },
    ])
    .png()
    .toBuffer()

  // Hueco real + un hueco señuelo más tenue, para que un análisis simple de bordes dude
  const decoyX = x > W / 2 ? crypto.randomInt(S + 10, Math.max(S + 11, x - S)) : crypto.randomInt(Math.min(x + S, W - S - 1), W - S)
  const background = await sharp(base)
    .composite([
      { input: pieceSvg("rgba(0,0,0,0.55)", "rgba(255,255,255,0.9)"), left: x, top: y },
      { input: pieceSvg("rgba(0,0,0,0.18)", "rgba(255,255,255,0.35)"), left: decoyX, top: crypto.randomInt(8, H - S - 8) },
    ])
    .jpeg({ quality: 78 })
    .toBuffer()

  return {
    answer: { x },
    public: {
      background: `data:image/jpeg;base64,${background.toString("base64")}`,
      piece: `data:image/png;base64,${piece.toString("base64")}`,
      pieceY: y,
      pieceSize: S,
      width: W,
      height: H,
    },
  }
}

export function checkSliderAnswer(
  expected: { x: number },
  answer: unknown,
): { ok: boolean; reason?: "wrong" | "robot"; analysis?: TrailAnalysis } {
  const a = (answer ?? {}) as { x?: unknown; trail?: unknown }
  const x = Number(a.x)
  if (!Number.isFinite(x) || Math.abs(x - expected.x) > TOLERANCE_PX) return { ok: false, reason: "wrong" }

  const trail: TrailPoint[] = sanitizeTrail(a.trail)
  const analysis = analyzeTrail(trail, { minPoints: 8, minDurationMs: 250 })
  if (analysis.robotic) return { ok: false, reason: "robot", analysis }
  return { ok: true, analysis }
}
