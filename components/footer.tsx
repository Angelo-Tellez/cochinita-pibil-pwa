"use client"

import Link from "next/link"
import { Mail, MapPin, Phone, Facebook, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-8">
          {/* Sobre Nosotros */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Sobre Nosotros</h3>
            <Link href="/about" className="inline-block">
              <button className="text-muted-foreground hover:text-primary transition-colors">Historia Porke</button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Disfruta de la auténtica Cochinita Pibil preparada con tradición y calidad. Una experiencia culinaria
              yucateca en cada plato.
            </p>
          </div>

          {/* Trabaja Con Nosotros */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Únete al Equipo</h3>
            <Link href="/careers" className="inline-block">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                Trabaja Con Nosotros
              </button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              ¿Te gustaría formar parte de nuestro equipo? Envía tu solicitud y cuéntanos por qué quieres trabajar con
              nosotros.
            </p>
          </div>

          {/* Atención al Cliente */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Atención al Cliente</h3>
            <div className="space-y-2">
              <Link href="/contact" className="inline-block">
                <button className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Contáctanos
                </button>
              </Link>
              <br />
              <Link href="/customer-service" className="inline-block">
                <button className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Facturas Electrónicas
                </button>
              </Link>
              <br />
              <Link href="/customer-service" className="inline-block">
                <button className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Formas de Compra
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8 py-8 border-t border-border pt-8">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-semibold text-foreground">+34 999-123-4567</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground">info@porke.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="font-semibold text-foreground">Mérida, Yucatán</p>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-6 py-6 border-t border-border">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
            <Facebook className="h-6 w-6" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="h-6 w-6" />
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border">
          <p>&copy; 2025 Porke - Cochinita Pibil. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
