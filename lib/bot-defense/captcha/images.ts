import crypto from "crypto"
import fs from "fs/promises"
import path from "path"

// Fotos del menú agrupadas por categoría. Se usan en el reto de selección de imágenes
// y como fondo del puzzle deslizante.
export const PHOTO_CATEGORIES = {
  bebidas: {
    prompt: "Selecciona todas las imágenes con bebidas",
    files: ["agua-horchata", "agua-jamaica", "cerveza-corona", "jugo-natural-fresco", "refresco-mexicano"],
  },
  sopas: {
    prompt: "Selecciona todas las imágenes con sopas o caldos",
    files: ["caldo-de-res", "consome-pollo", "sopa-de-lima", "sopa-maiz-yucateca"],
  },
  cochinita: {
    prompt: "Selecciona todos los platillos de cochinita pibil",
    files: ["burrito-cochinita", "cochinita-pibil-traditional", "enchiladas-cochinita-pibil", "plato-mixto-cochinita", "quesadilla-pibil", "sandwich-cochinita", "tacos-cochinita-pibil"],
  },
  guarniciones: {
    prompt: "Selecciona todas las guarniciones (arroz, frijoles, guacamole, tortillas…)",
    files: ["arroz-blanco", "frijoles-refritos", "guacamole-fresco", "encurtido-yucateco", "tortillas-maiz"],
  },
} as const

type Category = keyof typeof PHOTO_CATEGORIES

export const ALL_PHOTOS: string[] = Object.values(PHOTO_CATEGORIES).flatMap((c) => [...c.files])
export const GRID_SIZE = 9
export const TILE = 120

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function photoPath(name: string) {
  if (!ALL_PHOTOS.includes(name)) throw new Error("Foto desconocida")
  return path.join(process.cwd(), "public", `${name}.jpg`)
}

export function createImagesChallenge() {
  const categories = Object.keys(PHOTO_CATEGORIES) as Category[]
  const target = categories[crypto.randomInt(0, categories.length)]
  const targetFiles = shuffle([...PHOTO_CATEGORIES[target].files] as string[])
  const correctCount = crypto.randomInt(2, Math.min(4, targetFiles.length) + 1)
  const others = shuffle(categories.filter((c) => c !== target).flatMap((c) => [...PHOTO_CATEGORIES[c].files] as string[]))

  const tiles = shuffle([
    ...targetFiles.slice(0, correctCount).map((f) => ({ f, ok: true })),
    ...others.slice(0, GRID_SIZE - correctCount).map((f) => ({ f, ok: false })),
  ])

  return {
    prompt: PHOTO_CATEGORIES[target].prompt,
    files: tiles.map((t) => t.f),
    answer: tiles.flatMap((t, i) => (t.ok ? [i] : [])),
  }
}

export function checkImagesAnswer(expected: number[], answer: unknown) {
  if (!Array.isArray(answer)) return false
  const chosen = [...new Set(answer.map(Number))].sort((a, b) => a - b)
  return chosen.length === expected.length && chosen.every((v, i) => v === expected[i])
}

// Cada mosaico se sirve recortado, volteado y con brillo/saturación al azar, así que
// los bytes cambian en cada reto: un bot no puede memorizar el hash de cada foto.
export async function renderTile(name: string): Promise<{ body: Buffer; type: string }> {
  const file = photoPath(name)
  try {
    const sharp = (await import("sharp")).default
    const positions = ["centre", "north", "south", "east", "west", "northeast", "southwest"]
    let img = sharp(file)
      .resize(TILE + crypto.randomInt(0, 30), TILE + crypto.randomInt(0, 30), { fit: "cover", position: positions[crypto.randomInt(0, positions.length)] })
      .modulate({ brightness: 0.9 + Math.random() * 0.2, saturation: 0.85 + Math.random() * 0.3 })
    if (crypto.randomInt(0, 2)) img = img.flop()
    const body = await img.resize(TILE, TILE, { fit: "cover" }).jpeg({ quality: 70 + crypto.randomInt(0, 15) }).toBuffer()
    return { body, type: "image/jpeg" }
  } catch {
    // Sin sharp: se sirve la foto original (sigue sin revelar el nombre del archivo)
    return { body: await fs.readFile(file), type: "image/jpeg" }
  }
}
