"""
Extracción del menú del sitio propio "Porké - Comida Yucateca Auténtica" con Selenium.

Flujo: carga del menú (renderizado por JavaScript desde Firestore) -> recorrido por
categorías -> navegación al detalle de cada platillo. El resultado crudo se guarda
en data/menu_crudo.csv.

Uso:
    python scripts/scraping_porke.py                 # sitio local (npm run dev)
    python scripts/scraping_porke.py --vercel        # sitio publicado en Vercel
    python scripts/scraping_porke.py --url <URL>     # cualquier otra URL
"""
import sys
import time
from pathlib import Path

import pandas as pd
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from navegador import crear_driver

URL_LOCAL = "http://localhost:3000"
URL_VERCEL = "https://cochinita-pibil-pwa.vercel.app"
CARPETA_DATOS = Path(__file__).resolve().parent.parent / "data"
ARCHIVO_CRUDO = CARPETA_DATOS / "menu_crudo.csv"
PAUSA_ENTRE_PAGINAS = 1.5  # segundos; pausa ética para no saturar al servidor


def url_desde_argumentos(argv):
    """Devuelve la URL base según los argumentos --vercel o --url <URL>."""
    if "--vercel" in argv:
        return URL_VERCEL
    if "--url" in argv:
        return argv[argv.index("--url") + 1].rstrip("/")
    return URL_LOCAL


def cargar_menu(driver, wait, base_url):
    """1. Carga dinámica: espera a que el menú deje de mostrar 'Cargando menú...'."""
    print(f"[+] 1. Conectando a {base_url} y esperando a que se renderice el menú...")
    driver.get(base_url)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "main h2")))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "main a[href^='/products/']")))


def extraer_tarjetas(driver):
    """2. Recorre cada categoría (encabezado h2) y extrae las tarjetas de sus platillos."""
    print("[+] 2. Recorriendo categorías del menú...")
    registros = []
    for seccion in driver.find_elements(By.XPATH, "//main/div[h2]"):
        categoria = seccion.find_element(By.TAG_NAME, "h2").text.strip()
        tarjetas = seccion.find_elements(By.CSS_SELECTOR, "a[href^='/products/']")
        print(f"    - {categoria}: {len(tarjetas)} platillos")
        for tarjeta in tarjetas:
            registros.append({
                "Categoria": categoria,
                "Platillo": tarjeta.find_element(By.TAG_NAME, "h3").text,
                "Descripcion": tarjeta.find_element(By.CSS_SELECTOR, "h3 + p").text,
                "Precio": tarjeta.find_element(By.CSS_SELECTOR, "span.text-primary").text,
                "URL_Origen": tarjeta.get_attribute("href"),
            })
    return registros


def _valor_detalle(driver, etiqueta):
    """Lee el valor que acompaña a una etiqueta en la página de detalle (o None)."""
    try:
        return driver.find_element(
            By.XPATH, f"//p[normalize-space()='{etiqueta}']/following-sibling::p[1]").text
    except NoSuchElementException:
        return None


def extraer_detalle(driver, wait, registro):
    """3. Navega a la página del platillo y completa calorías, porción, ingredientes y detalles."""
    driver.get(registro["URL_Origen"])
    wait.until(EC.presence_of_element_located((By.XPATH, "//p[normalize-space()='Ingredientes']")))
    registro.update({
        "Detalles": _valor_detalle(driver, "Detalles del Producto"),
        "Calorias": _valor_detalle(driver, "Calorías"),
        "Porcion": _valor_detalle(driver, "Porción"),
        "Ingredientes": _valor_detalle(driver, "Ingredientes"),
        "Fecha_Captura": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
    })


def ejecutar_scraping(base_url=URL_LOCAL):
    """Ejecuta el flujo completo y guarda los datos crudos. Devuelve la ruta del CSV."""
    driver = crear_driver(headless=False)
    wait = WebDriverWait(driver, 20)
    registros = []
    try:
        cargar_menu(driver, wait, base_url)
        registros = extraer_tarjetas(driver)
        print(f"[+] {len(registros)} platillos encontrados en la portada.")

        print("[+] 3. Navegando al detalle de cada platillo...")
        for i, registro in enumerate(registros, 1):
            try:
                extraer_detalle(driver, wait, registro)
                print(f"    [{i}/{len(registros)}] {registro['Platillo']}")
            except TimeoutException:
                print(f"    [{i}/{len(registros)}] {registro['Platillo']}: el detalle no cargó, se omite")
            time.sleep(PAUSA_ENTRE_PAGINAS)
    except TimeoutException:
        print("[-] El sitio tardó demasiado en responder; se guardará lo extraído hasta ahora.")
    finally:
        driver.quit()

    CARPETA_DATOS.mkdir(exist_ok=True)
    df = pd.DataFrame(registros)
    df.insert(0, "ID", range(1, len(df) + 1))
    df["Sitio"] = base_url
    df.to_csv(ARCHIVO_CRUDO, index=False, encoding="utf-8-sig")
    print(f"\n[+] {len(df)} registros crudos guardados en {ARCHIVO_CRUDO}")
    return ARCHIVO_CRUDO


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    ejecutar_scraping(url_desde_argumentos(sys.argv))
