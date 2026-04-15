import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, CreditCard, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function CustomerServicePage() {
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
            <h1 className="text-2xl font-bold text-primary">Atención al Cliente</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl w-full px-4 py-12 sm:px-6 lg:px-8 flex-1">
        <div className="space-y-8">
          {/* Contáctanos */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-4">
                <HelpCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-2">Contáctanos</h3>
                  <p className="text-muted-foreground mb-4">
                    Estamos aquí para ayudarte. Si tienes preguntas sobre tus pedidos, necesitas reportar un problema o
                    simplemente quieres comunicarte con nosotros, no dudes en contactarnos.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                      <p className="text-lg font-semibold text-foreground">+34 999-123-4567</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-lg font-semibold text-foreground">contacto@porke.com</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Horario de Atención</p>
                      <p className="text-lg font-semibold text-foreground">Lunes a Domingo, 10:00 AM - 10:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facturas Electrónicas */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-2">Facturas Electrónicas</h3>
                  <p className="text-muted-foreground mb-4">
                    Ofrecemos facturas electrónicas (CFDI) para todos nuestros clientes que lo requieran. Esto es
                    especialmente útil para deducibilidad fiscal y registro contable.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Cómo Solicitar tu Factura:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Completa tu pedido normalmente</li>
                        <li>En el formulario de checkout, solicita factura electrónica</li>
                        <li>Ingresa tus datos fiscales (RFC, razón social, domicilio)</li>
                        <li>Recibirás tu CFDI por email dentro de 24 horas</li>
                      </ol>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        RFC del Negocio: POR-123456-XYZ
                        <br />
                        Régimen Fiscal: Personas Morales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formas de Compra */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-4">
                <CreditCard className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-2">Formas de Compra</h3>
                  <p className="text-muted-foreground mb-6">
                    En Porke aceptamos múltiples formas de pago para tu comodidad. Elige la que mejor se adapte a ti.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Efectivo</h4>
                      <p className="text-sm text-muted-foreground">
                        Paga en la tienda física o al momento del pickup. Sin cargos adicionales.
                      </p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Tarjeta de Crédito/Débito</h4>
                      <p className="text-sm text-muted-foreground">
                        Aceptamos Visa, Mastercard, American Express y todas las tarjetas bancarias mexicanas.
                      </p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Transferencia Bancaria</h4>
                      <p className="text-sm text-muted-foreground">
                        Para pedidos grandes, puedes realizar transferencia bancaria. Contacta para los detalles de
                        cuenta.
                      </p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Billeteras Digitales</h4>
                      <p className="text-sm text-muted-foreground">
                        Soportamos Apple Pay, Google Pay, PayPal y otras billeteras digitales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preguntas Frecuentes */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    ¿Cuál es el tiempo mínimo de espera para un pedido?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    El tiempo mínimo es de 15 minutos a partir de la confirmación. Puedes seleccionar la hora específica
                    en la que quieres recoger tu pedido.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    ¿Pueden modificar mi pedido después de realizarlo?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Sí, si lo haces dentro de 10 minutos después de la confirmación. Contacta al número de teléfono
                    inmediatamente para realizar cambios.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">¿Hay descuentos para pedidos al por mayor?</h4>
                  <p className="text-sm text-muted-foreground">
                    Sí, ofrecemos descuentos especiales para pedidos empresariales. Contacta directamente para cotizar
                    tu pedido.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
