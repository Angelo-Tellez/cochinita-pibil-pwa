/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite abrir el servidor de desarrollo desde la IP de red (p. ej. el celular)
  allowedDevOrigins: ['10.228.4.188'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Los CAPTCHAs de imágenes y del puzzle leen las fotos de /public desde el servidor
  outputFileTracingIncludes: {
    '/api/**': ['./public/*.jpg'],
  },
  headers: async () => {
    // Content-Security-Policy adaptada a los servicios que usa la app:
    // - reCAPTCHA v2 (google.com / gstatic.com)
    // - PayPal (paypal.com / paypalobjects.com / api-m.sandbox.paypal.com)
    // - Firebase Auth + Firestore (*.googleapis.com, *.firebaseio.com, *.firebaseapp.com)
    // - Cloudinary (imágenes y subidas)
    // - Vercel Analytics
    // Nota: se usa 'unsafe-inline'/'unsafe-eval' porque Next.js (hidratación) y esos
    // widgets de terceros inyectan scripts/estilos en línea sin nonce.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://*.paypal.com https://www.paypalobjects.com https://apis.google.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleapis.com https://www.gstatic.com https://*.paypal.com https://www.paypalobjects.com https://www.google.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.cloudinary.com https://*.paypal.com https://www.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://www.google.com https://*.paypal.com https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ')

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]

    return [
      {
        // Cabeceras de seguridad en todas las rutas
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
