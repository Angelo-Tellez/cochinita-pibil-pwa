"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bot, Fingerprint, Gauge, KeyRound, Puzzle, Shuffle, Timer, FileText } from "lucide-react"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaptchaWidget } from "@/components/human-check"
import { CAPTCHA_LABELS, CAPTCHA_TYPES, type CaptchaType, type PublicChallenge } from "@/lib/bot-defense/captcha/types"
import { postJson, secureFetch } from "@/lib/secure-fetch"

const MECHANISMS = [
  { icon: Puzzle, title: "5 CAPTCHAs propios", where: "Registro, login y contacto", text: "Aritmético, texto distorsionado, puzzle deslizante, selección de imágenes y casilla “No soy un robot”. Todos se validan en el servidor con la respuesta cifrada (AES-GCM) y un solo intento por reto." },
  { icon: Fingerprint, title: "Interacción humana", where: "Todos los formularios", text: "Movimiento del mouse, ritmo de tecleo, intervalos entre clics, pegado, autocompletado, event.isTrusted y navigator.webdriver. El servidor suma una puntuación de riesgo." },
  { icon: Bot, title: "Honeypot", where: "Todos los formularios", text: "Campo invisible para personas. Si llega con texto, la petición se bloquea con 403 sin opción a CAPTCHA." },
  { icon: Gauge, title: "Rate limiting", where: "Todas las rutas /api", text: "Ventana deslizante por IP y por sesión, separada por ámbito (formularios 5/min por sesión), y máximo 3 peticiones simultáneas por IP. Responde 429 con Retry-After." },
  { icon: KeyRound, title: "Tokens CSRF", where: "Todas las rutas /api que modifican", text: "Token HMAC ligado a la cookie de sesión httpOnly (SameSite=Strict), enviado en la cabecera X-CSRF-Token, más verificación de Origin." },
  { icon: Shuffle, title: "IDs dinámicos", where: "Login, registro y contacto", text: "Los atributos name/id de cada campo los genera el servidor al azar en cada carga: By.NAME(\"email\") nunca funciona." },
  { icon: Timer, title: "Carga diferida (Fetch)", where: "Login, registro y contacto", text: "El HTML inicial no contiene el formulario: se pide por fetch con un token que guarda la hora de emisión, así el servidor mide el tiempo real de llenado." },
  { icon: FileText, title: "Bitácora de auditoría", where: "logs/bot-audit.log", text: "Cada decisión (aprobado, reto, bloqueo, 429, CSRF rechazado) se registra en JSON Lines con IP, cabeceras, señales y puntuación." },
]

function CaptchaDemo({ type }: { type: CaptchaType }) {
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null)
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setPassed(false)
    const { data } = await postJson("/api/captcha", { type })
    setChallenge(data.challenge ?? null)
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {challenge && <CaptchaWidget challenge={challenge} passed={passed} onPass={() => setPassed(true)} onChallenge={setChallenge} />}
      {(!challenge || passed) && (
        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          {loading ? "Cargando..." : challenge ? "Probar otro reto" : `Cargar reto: ${CAPTCHA_LABELS[type]}`}
        </Button>
      )}
    </div>
  )
}

type Row = { label: string; status: number; detail: string }

function ResultTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return null
  return (
    <ul className="mt-3 space-y-1 font-mono text-xs">
      {rows.map((r, i) => (
        <li key={i} className="flex flex-wrap gap-2">
          <span className="text-muted-foreground">{r.label}</span>
          <span className={r.status === 200 ? "text-green-700" : r.status === 429 ? "text-amber-700" : "text-red-700"}>HTTP {r.status}</span>
          <span className="text-muted-foreground">{r.detail}</span>
        </li>
      ))}
    </ul>
  )
}

function CsrfDemo() {
  const [rows, setRows] = useState<Row[]>([])
  const run = async () => {
    const out: Row[] = []
    const without = await fetch("/api/captcha", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    out.push({ label: "Sin token CSRF:", status: without.status, detail: `X-CSRF-Error: ${without.headers.get("X-CSRF-Error") ?? "-"}` })
    const forged = await fetch("/api/captcha", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": `${Date.now() + 60_000}.falso.firmaInventada` }, body: "{}" })
    out.push({ label: "Token falsificado:", status: forged.status, detail: `X-CSRF-Error: ${forged.headers.get("X-CSRF-Error") ?? "-"}` })
    const valid = await secureFetch("/api/captcha", { method: "POST", body: "{}" })
    out.push({ label: "Token válido:", status: valid.status, detail: "reto entregado" })
    setRows(out)
  }
  return (
    <div>
      <Button type="button" variant="outline" onClick={run}>Enviar 3 peticiones</Button>
      <ResultTable rows={rows} />
    </div>
  )
}

function RateLimitDemo() {
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const run = async () => {
    setRunning(true)
    const out: Row[] = []
    for (let i = 1; i <= 8; i++) {
      const res = await secureFetch("/api/verify-human", { method: "POST", body: JSON.stringify({ form: "login", signals: {} }) })
      const retry = res.headers.get("Retry-After")
      out.push({ label: `Petición ${i}:`, status: res.status, detail: res.status === 429 ? `Retry-After: ${retry} s` : `restantes: ${res.headers.get("X-RateLimit-Remaining") ?? "-"}` })
      setRows([...out])
    }
    setRunning(false)
  }
  return (
    <div>
      <Button type="button" variant="outline" onClick={run} disabled={running}>Enviar 8 intentos de login seguidos</Button>
      <p className="mt-2 text-xs text-muted-foreground">El límite es de 5 por minuto por sesión: tu login quedará bloqueado un minuto.</p>
      <ResultTable rows={rows} />
    </div>
  )
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Seguridad del sitio</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Cómo protegemos Porké de los bots</h2>
          <p className="text-muted-foreground mb-6">Mecanismos activos en el sitio y dónde se aplican.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MECHANISMS.map(({ icon: Icon, title, where, text }) => (
              <Card key={title}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-primary mb-1">{where}</p>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Prueba cada CAPTCHA</h2>
          <Card>
            <CardContent className="p-5">
              <Tabs defaultValue="math">
                <TabsList className="flex h-auto flex-wrap">
                  {CAPTCHA_TYPES.map((t) => (
                    <TabsTrigger key={t} value={t}>{CAPTCHA_LABELS[t]}</TabsTrigger>
                  ))}
                </TabsList>
                {CAPTCHA_TYPES.map((t) => (
                  <TabsContent key={t} value={t} className="pt-4">
                    <CaptchaDemo type={t} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Prueba de CSRF</CardTitle></CardHeader>
            <CardContent><CsrfDemo /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Prueba de rate limiting</CardTitle></CardHeader>
            <CardContent><RateLimitDemo /></CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
