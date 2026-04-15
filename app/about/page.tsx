import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Sobre Nosotros</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl w-full px-4 py-12 sm:px-6 lg:px-8 flex-1">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Historia de Porke</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Porke nace de la pasión por mantener viva la tradición culinaria yucateca. Hace más de 15 años, nuestro
              fundador decidió compartir con el mundo la auténtica receta de la Cochinita Pibil, preparada con técnicas
              ancestrales y los mejores ingredientes de la región.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              Cada plato que sale de nuestras cocinas es una celebración de nuestra herencia cultural. Marinamos la
              carne en achiote durante 12 horas, seguidas de una cocción lenta en hojas de plátano que garantiza la
              ternura y sabor inigualable que nuestros clientes adoran.
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Nuestros Valores</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">•</span>
                <div>
                  <p className="font-semibold text-foreground">Autenticidad</p>
                  <p className="text-sm text-muted-foreground">
                    Respetamos las tradiciones culinarias yucatecas en cada receta
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">•</span>
                <div>
                  <p className="font-semibold text-foreground">Calidad Premium</p>
                  <p className="text-sm text-muted-foreground">
                    Usamos solo ingredientes frescos y de la mejor calidad disponible
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">•</span>
                <div>
                  <p className="font-semibold text-foreground">Servicio Rápido</p>
                  <p className="text-sm text-muted-foreground">
                    Prepara tus pedidos con rapidez sin comprometer la calidad
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">•</span>
                <div>
                  <p className="font-semibold text-foreground">Satisfacción del Cliente</p>
                  <p className="text-sm text-muted-foreground">
                    Tu felicidad al disfrutar nuestros platillos es nuestro objetivo
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Por Qué Elegirnos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-card border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Recetas Ancestrales</h4>
                <p className="text-sm text-muted-foreground">
                  Nuestras recetas han sido transmitidas de generación en generación, garantizando autenticidad en cada
                  bocado.
                </p>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Ingredientes Frescos</h4>
                <p className="text-sm text-muted-foreground">
                  Obtenemos nuestros ingredientes diariamente de proveedores locales seleccionados en Yucatán.
                </p>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Pickup Sin Colas</h4>
                <p className="text-sm text-muted-foreground">
                  Ordena en línea y recoge tu pedido a la hora exacta que especificaste. ¡Sin esperas!
                </p>
              </div>
              <div className="p-6 bg-card border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Equipo Profesional</h4>
                <p className="text-sm text-muted-foreground">
                  Nuestro equipo de cocineros está certificado y apasionado por la gastronomía yucateca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
