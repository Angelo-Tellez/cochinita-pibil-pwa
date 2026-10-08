import fs from "fs"
import path from "path"

// Registro de auditoría en formato JSON Lines (una línea por evento).
// Se escribe en consola siempre y en logs/bot-audit.log cuando el sistema de
// archivos lo permite (en local sí; en Vercel sólo queda en los logs de la función).

const LOG_FILE = path.join(process.cwd(), "logs", "bot-audit.log")

export function auditLog(entry: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry })
  console.log("[bot-audit]", line)
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
    fs.appendFileSync(LOG_FILE, line + "\n")
  } catch {
    // Sistema de archivos de sólo lectura: nos quedamos con el log de consola
  }
}
