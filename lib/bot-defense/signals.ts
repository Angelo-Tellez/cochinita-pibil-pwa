// Señales de comportamiento que el cliente envía y que el servidor puntúa.
// Ninguna señal por sí sola decide: se suman pesos y se compara con umbrales,
// para reducir falsos positivos (p. ej. usuarios con autocompletar o en móvil).

export interface ClientSignals {
  elapsedMs: number          // tiempo desde que se montó el formulario hasta el submit
  mouseMoves: number         // eventos mousemove / pointermove
  keyDowns: number           // teclas pulsadas
  pastes: number             // eventos paste (gestores de contraseñas, copiar/pegar)
  autofilled: boolean        // el navegador autocompletó campos
  focusChanges: number       // focus/blur entre campos
  clickIntervals: number[]   // ms entre clics consecutivos
  keyIntervals: number[]     // ms entre teclas consecutivas
  touch: boolean             // dispositivo táctil (no genera mousemove)
  webdriver: boolean         // navigator.webdriver
  submitTrusted: boolean     // event.isTrusted del submit
  honeypot: string           // campo oculto: un humano nunca lo llena
}

export interface HeaderSignals {
  userAgent: string
  acceptLanguage: string | null
  secChUa: string | null
  secFetchSite: string | null
}

export interface Assessment {
  score: number
  reasons: string[]
  verdict: "human" | "challenge" | "block"
}

function stdDev(values: number[]) {
  if (values.length < 2) return Infinity
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length)
}

export function assess(s: Partial<ClientSignals>, h: HeaderSignals): Assessment {
  let score = 0
  const reasons: string[] = []
  const add = (points: number, reason: string) => { score += points; reasons.push(`+${points} ${reason}`) }

  // --- Señales duras (muy robustas) ---
  if (s.honeypot) add(10, "honeypot lleno")
  if (s.webdriver) add(5, "navigator.webdriver = true")
  if (/HeadlessChrome|PhantomJS|Selenium|puppeteer|playwright/i.test(h.userAgent)) add(5, "User-Agent de navegador headless/automatizado")
  if (h.secChUa && /HeadlessChrome/i.test(h.secChUa)) add(3, "Sec-CH-UA headless")
  if (!h.userAgent) add(4, "sin User-Agent")
  if (s.submitTrusted === false) add(3, "submit disparado por JS (isTrusted = false)")

  // --- Señales de comportamiento (medianamente robustas) ---
  const elapsed = s.elapsedMs ?? 0
  const assisted = s.autofilled || (s.pastes ?? 0) > 0
  if (elapsed < 800) add(3, `formulario llenado en ${elapsed} ms`)
  else if (elapsed < 2000 && !assisted) add(1, `formulario llenado muy rápido (${elapsed} ms)`)

  // Sin mouse sólo es sospechoso en escritorio: en móvil es lo normal
  if (!s.touch && (s.mouseMoves ?? 0) === 0) add(2, "sin movimiento de mouse en escritorio")

  // Escribir sin pulsar teclas sólo es normal si hubo autocompletado o pegado
  if ((s.keyDowns ?? 0) === 0 && !assisted) add(2, "campos llenos sin teclas ni autocompletado")

  // Ritmo de tecleo perfectamente uniforme = script (send_keys)
  const keySd = stdDev(s.keyIntervals ?? [])
  if ((s.keyIntervals?.length ?? 0) >= 5 && keySd < 5) add(2, `ritmo de tecleo uniforme (σ=${keySd.toFixed(1)} ms)`)

  const clickSd = stdDev(s.clickIntervals ?? [])
  if ((s.clickIntervals?.length ?? 0) >= 3 && clickSd < 10) add(1, `intervalos entre clics uniformes (σ=${clickSd.toFixed(1)} ms)`)

  // --- Cabeceras (débiles: fáciles de falsificar, útiles para auditoría) ---
  if (!h.acceptLanguage) add(1, "sin Accept-Language")

  const verdict = score >= 8 ? "block" : score >= 3 ? "challenge" : "human"
  return { score, reasons, verdict }
}
