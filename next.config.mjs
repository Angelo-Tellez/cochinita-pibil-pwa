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
    return [
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
