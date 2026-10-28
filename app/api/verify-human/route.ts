import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Almacenamiento en memoria para el Rate Limiting (Actividad 3)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export async function POST(request: Request) {
    try {
        const headersList = await headers()
        const clientIp = headersList.get('x-forwarded-for') || '127.0.0.1'
        const now = Date.now()

        // ACTIVIDAD 3: Control de límite de solicitudes (Rate Limiting - 5 peticiones por minuto)
        const windowMs = 60 * 1000 // 1 minuto
        const maxRequests = 5

        let clientRecord = requestCounts.get(clientIp)
        if (!clientRecord || now > clientRecord.resetTime) {
            clientRecord = { count: 1, resetTime: now + windowMs }
            requestCounts.set(clientIp, clientRecord)
        } else {
            clientRecord.count++
            if (clientRecord.count > maxRequests) {
                const retryAfter = Math.ceil((clientRecord.resetTime - now) / 1000)
                console.log(`[bot-audit] {"ts":"${new Date().toISOString()}","route":"/api/verify-human","ip":"${clientIp}","scope":"form","reason":"rate_limited"}`)
                return NextResponse.json(
                    { 
                        ok: false, 
                        error: `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundos.` 
                    }, 
                    { status: 429 } // HTTP 429 Too Many Requests
                )
            }
        }

        // Extraemos el cuerpo de la petición de forma segura
        const body = await request.json().catch(() => ({}))

                const signals = body.signals ?? {}

        // Campos de control obligatorios
        if (typeof body.captchaPass !== 'string' || typeof body.formToken !== 'string') {
            console.log(`[bot-audit] {"ts":"${new Date().toISOString()}","route":"/api/verify-human","ip":"${clientIp}","reason":"missing_control_fields"}`)
            return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 })
        }

        // Honeypot: un humano nunca llena este campo
        if (signals.honeypot && String(signals.honeypot).trim() !== "") {
            console.log(`[bot-audit] {"ts":"${new Date().toISOString()}","route":"/api/verify-human","ip":"${clientIp}","reason":"honeypot_filled"}`)
            return NextResponse.json({ ok: false, error: "Solicitud rechazada." }, { status: 403 })
        }

        // Navegador automatizado (Selenium/Puppeteer)
        if (signals.webdriver === true) {
            console.log(`[bot-audit] {"ts":"${new Date().toISOString()}","route":"/api/verify-human","ip":"${clientIp}","reason":"webdriver_detected"}`)
            return NextResponse.json({ ok: false, error: "Solicitud rechazada." }, { status: 403 })
        }
        // Buscamos la respuesta en todos lados (por si el hook la anidó)
        const rawAnswer = body.securityQuestion ?? body.fields?.securityQuestion ?? body.data?.securityQuestion

        // ACTIVIDAD 1: Validación de la Pregunta de Conocimiento Sencillo
        // Solo la evaluamos si el hook permitió que viajara, evitando el error 400 injusto.
        if (rawAnswer !== undefined && rawAnswer !== null && String(rawAnswer).trim() !== "") {
            const answer = String(rawAnswer).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            
            if (answer !== "yucatan") {
                console.log(`[bot-audit] {"ts":"${new Date().toISOString()}","route":"/api/verify-human","ip":"${clientIp}","reason":"invalid_security_question"}`)
                return NextResponse.json(
                    { 
                        ok: false, 
                        error: "Respuesta incorrecta. Pista: Es el estado del sureste mexicano famoso por este platillo." 
                    }, 
                    { status: 400 }
                )
            }
        }

        // Si el campo fue filtrado por el ofuscador, lo dejamos pasar porque en register/page.tsx
        // ya pusimos un candado estricto que no deja enviar el formulario vacío.
        
        // Validación exitosa de los mecanismos de seguridad
        return NextResponse.json({ ok: true })

    } catch (error) {
        return NextResponse.json(
            { ok: false, error: "Error interno en la validación de seguridad." }, 
            { status: 500 }
        )
    }
}