"use client"

// fetch con token CSRF: lo pide una vez a /api/session (que también crea la cookie
// de sesión) y lo envía en la cabecera X-CSRF-Token. Si el servidor lo rechaza
// (expiró la sesión), pide uno nuevo y reintenta una sola vez.

let csrfPromise: Promise<string> | null = null

function getCsrfToken(): Promise<string> {
  csrfPromise ??= fetch("/api/session", { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.csrfToken) throw new Error(data.error || "No se pudo iniciar la sesión segura")
      return data.csrfToken as string
    })
    .catch((err) => {
      csrfPromise = null
      throw err
    })
  return csrfPromise
}

export async function secureFetch(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("X-CSRF-Token", await getCsrfToken())
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  const res = await fetch(input, { ...init, headers, credentials: "same-origin" })
  if (res.status === 403 && retry && res.headers.get("X-CSRF-Error")) {
    csrfPromise = null
    return secureFetch(input, init, false)
  }
  return res
}

export async function postJson<T = any>(url: string, body: unknown): Promise<{ res: Response; data: T }> {
  const res = await secureFetch(url, { method: "POST", body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as T
  return { res, data }
}
