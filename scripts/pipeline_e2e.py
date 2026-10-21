"""
Prueba End-to-End del proyecto completo sobre el sitio propio Porké:

    1. Defensa anti-bot: el bot de Selenium intenta iniciar sesión y es detenido
       (CAPTCHA adaptativo, bloqueo por honeypot y rate limiting HTTP 429).
    2. Extracción del menú con Selenium (categorías y detalle de cada platillo).
    3. Limpieza con Pandas y persistencia en CSV, Excel y SQLite.
    4. Extracción en el portal oficial datos.gob.mx (búsqueda, filtro CSV y paginación).
    5. Limpieza y persistencia de los datos del portal oficial.
    6. Verificación de la base de datos.

Uso:
    python scripts/pipeline_e2e.py                  # sitio local (requiere npm run dev)
    python scripts/pipeline_e2e.py --vercel         # sitio publicado en Vercel
    python scripts/pipeline_e2e.py --sin-datosgob   # omite las etapas 4 y 5
"""
import sys
import time

import consultar_bd
import limpieza_datosgob
import limpieza_pandas
import scraping_datosgob
import scraping_porke
import selenium_bot_test


def titulo(texto):
    print("\n" + "=" * 70 + f"\n  {texto}\n" + "=" * 70)


def main():
    inicio = time.time()
    base_url = scraping_porke.url_desde_argumentos(sys.argv)
    print(f"Sitio objetivo: {base_url}")

    titulo("ETAPA 1A · Login: bot que solo llena email y contraseña")
    r1 = selenium_bot_test.ejecutar_prueba(base_url, fill_all=False)
    titulo("ETAPA 1B · Login: bot agresivo que llena el honeypot")
    r2 = selenium_bot_test.ejecutar_prueba(base_url, fill_all=True)
    titulo("ETAPA 1C · CSRF y ráfaga de peticiones (rate limiting)")
    codigos = selenium_bot_test.prueba_rafaga(base_url)
    titulo("ETAPA 1D · Contacto: bot contra la casilla \"No soy un robot\"")
    r3 = selenium_bot_test.prueba_casilla(base_url)
    print(f"\n>> Defensa Porké: intento 1 = {r1}, intento 2 = {r2}, casilla = {r3}, "
          f"ráfaga = {codigos.count(429)} de {len(codigos)} peticiones frenadas con HTTP 429")

    titulo("ETAPA 2 · Extracción del menú de Porké con Selenium")
    scraping_porke.ejecutar_scraping(base_url)

    titulo("ETAPA 3 · Limpieza del menú con Pandas y persistencia (CSV / Excel / SQLite)")
    limpieza_pandas.procesar_datos()

    if "--sin-datosgob" not in sys.argv:
        titulo("ETAPA 4 · Portal oficial datos.gob.mx: búsqueda, filtro CSV y paginación")
        scraping_datosgob.ejecutar_scraping("tecnologia")
        titulo("ETAPA 5 · Limpieza y persistencia de los datos de datos.gob.mx")
        limpieza_datosgob.procesar_datos()

    titulo("ETAPA 6 · Verificación de la base de datos SQLite")
    consultar_bd.main()

    print(f"\n[OK] Flujo End-to-End completado en {time.time() - inicio:.1f} s")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
