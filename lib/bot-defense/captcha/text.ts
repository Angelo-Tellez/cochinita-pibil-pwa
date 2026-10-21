import crypto from "crypto"

// CAPTCHA de texto distorsionado, dibujado como SVG en el servidor.
// Cada carácter lleva rotación, tamaño, fuente y color al azar, con líneas y puntos
// de ruido encima. En el código fuente del SVG los caracteres van en orden aleatorio
// (la posición visual la da el atributo x) y se agregan señuelos fuera del área
// visible, así que leer el <text> del SVG en orden no da la respuesta.

const ALPHABET = "ABCDEFGHJKMNPRSTUVWXYZ23456789" // sin 0/O, 1/I/L, Q para evitar confusiones
const FONTS = ["Georgia, serif", "Verdana, sans-serif", "'Courier New', monospace", "Arial Black, sans-serif"]
const W = 220
const H = 72

const rnd = (min: number, max: number) => min + (crypto.randomInt(0, 10_000) / 10_000) * (max - min)
const pick = <T,>(arr: readonly T[]) => arr[crypto.randomInt(0, arr.length)]

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function createTextChallenge() {
  const length = 5
  const answer = Array.from({ length }, () => pick([...ALPHABET])).join("")
  const elements: string[] = []

  const step = (W - 30) / length
  answer.split("").forEach((ch, i) => {
    const x = 18 + i * step + rnd(-3, 3)
    const y = rnd(44, 56)
    const rot = rnd(-28, 28)
    const size = rnd(30, 38)
    const skew = rnd(-12, 12)
    const color = `hsl(${crypto.randomInt(0, 360)}, 55%, ${crypto.randomInt(20, 38)}%)`
    elements.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${pick(FONTS)}" font-size="${size.toFixed(1)}" font-weight="bold" fill="${color}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) skewX(${skew.toFixed(1)})">${ch}</text>`,
    )
  })

  // Señuelos: caracteres reales del SVG que quedan fuera del área visible
  for (let i = 0; i < 3; i++) {
    elements.push(`<text x="${(W + rnd(20, 200)).toFixed(1)}" y="${rnd(30, 60).toFixed(1)}" font-size="32">${pick([...ALPHABET])}</text>`)
  }

  const noise: string[] = []
  for (let i = 0; i < 6; i++) {
    noise.push(
      `<path d="M${rnd(0, 30).toFixed(1)} ${rnd(5, H - 5).toFixed(1)} C${rnd(40, 90).toFixed(1)} ${rnd(0, H).toFixed(1)}, ${rnd(120, 170).toFixed(1)} ${rnd(0, H).toFixed(1)}, ${rnd(190, W).toFixed(1)} ${rnd(5, H - 5).toFixed(1)}" stroke="hsl(${crypto.randomInt(0, 360)}, 45%, 40%)" stroke-width="${rnd(1, 2.5).toFixed(1)}" fill="none" opacity="0.75"/>`,
    )
  }
  for (let i = 0; i < 70; i++) {
    noise.push(`<circle cx="${rnd(0, W).toFixed(1)}" cy="${rnd(0, H).toFixed(1)}" r="${rnd(0.6, 1.8).toFixed(1)}" fill="hsl(${crypto.randomInt(0, 360)}, 40%, 45%)"/>`)
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="100%" height="100%" fill="hsl(${crypto.randomInt(30, 60)}, 60%, 94%)"/>` +
    shuffle([...elements, ...noise]).join("") +
    `</svg>`

  return { answer, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` }
}

export function checkTextAnswer(expected: string, answer: unknown) {
  return typeof answer === "string" && answer.replace(/\s+/g, "").toUpperCase() === expected
}
