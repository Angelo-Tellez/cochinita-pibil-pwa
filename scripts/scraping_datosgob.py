"""
Extracción ética de la Plataforma Nacional de Datos Abiertos (https://www.datos.gob.mx).

Flujo: búsqueda dinámica -> filtro de formato CSV -> extracción de tarjetas con paginación.
El resultado crudo se guarda en data/datosgob_crudo.csv.

Nota: el portal está protegido por Akamai, que rechaza navegadores headless
("Access Denied"), por eso este script se ejecuta siempre con ventana visible.

Uso:
    python scripts/scraping_datosgob.py [termino_de_busqueda] [--max-paginas N]
"""
import sys
import time
from pathlib import Path

import pandas as pd
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from navegador import crear_driver

URL_PORTAL = "https://www.datos.gob.mx/"
CARPETA_DATOS = Path(__file__).resolve().parent.parent / "data"
ARCHIVO_CRUDO = CARPETA_DATOS / "datosgob_crudo.csv"
PAUSA_ENTRE_PAGINAS = 3  # segundos; pausa ética para no saturar al servidor


def esperar_intervencion_humana(driver):
    """Si el portal muestra un bloqueo o desafío, pausa el bot y deja actuar a una persona."""
    if "Access Denied" in driver.title or "captcha" in driver.page_source.lower():
        print("[!] El portal mostró un bloqueo o desafío. No se intenta evadirlo.")
        if sys.stdin.isatty():
            input("    Resuélvelo manualmente en el navegador y presiona Enter para continuar...")
        else:
            sys.exit("    Ejecución detenida: se requiere intervención humana.")


def buscar(driver, wait, termino):
    """1. Búsqueda dinámica: escribe el término en la barra de búsqueda del portal."""
    print(f"[+] 1. Búsqueda: enviando la consulta '{termino}'...")
    barra = wait.until(EC.element_to_be_clickable(
        (By.XPATH, "//input[@type='text' or @type='search'][contains(@placeholder, 'Buscar')]")))
    barra.clear()
    barra.send_keys(termino)
    barra.send_keys(Keys.RETURN)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.resource-item")))


def aplicar_filtro_csv(driver, wait):
    """2. Aplicación de filtros: marca el formato CSV en el panel lateral."""
    print("[+] 2. Filtros: aplicando filtro de formato (CSV)...")
    filtro = wait.until(EC.presence_of_element_located((By.ID, "facet-res_format-CSV")))
    if not filtro.is_selected():
        driver.execute_script("arguments[0].click();", filtro)
        wait.until(EC.url_contains("res_format=CSV"))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.resource-item")))
    print("[+] Filtro CSV aplicado:", driver.current_url)


def _texto_campo(tarjeta, etiqueta):
    """Devuelve el texto que sigue a una etiqueta <strong> dentro de la tarjeta (o None)."""
    try:
        p = tarjeta.find_element(By.XPATH, f".//p[strong[starts-with(normalize-space(), '{etiqueta}')]]")
        return p.text.split(":", 1)[1].strip()
    except (NoSuchElementException, IndexError):
        return None


def extraer_pagina(driver, numero_pagina):
    """3a. Extrae los campos de cada tarjeta de resultados de la página actual."""
    registros = []
    capturado = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
    for tarjeta in driver.find_elements(By.CSS_SELECTOR, "li.resource-item"):
        try:
            enlace = tarjeta.find_element(By.CSS_SELECTOR, "h3 a")
        except NoSuchElementException:
            continue
        registros.append({
            "Conjunto_Datos": enlace.text.strip(),
            "Institucion": _texto_campo(tarjeta, "Institución"),
            "Categoria": _texto_campo(tarjeta, "Categoría"),
            "Ultima_Actualizacion": _texto_campo(tarjeta, "Última Actualización"),
            "Num_Bases": _texto_campo(tarjeta, "Número de bases de datos"),
            "URL_Origen": enlace.get_attribute("href"),
            "Pagina": numero_pagina,
            "Fecha_Captura": capturado,
        })
    return registros


def ir_a_siguiente(driver, wait):
    """3b. Paginación: hace clic en '»'. Devuelve False si ya no hay más páginas."""
    try:
        boton = driver.find_element(By.XPATH, "//a[contains(@class,'page-link') and normalize-space()='»']")
    except NoSuchElementException:
        return False
    if "disabled" in (boton.find_element(By.XPATH, "..").get_attribute("class") or ""):
        return False
    primera = driver.find_element(By.CSS_SELECTOR, "li.resource-item")
    driver.execute_script("arguments[0].scrollIntoView(); arguments[0].click();", boton)
    wait.until(EC.staleness_of(primera))  # espera explícita a que cargue la nueva página
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.resource-item")))
    return True


def ejecutar_scraping(termino="tecnologia", max_paginas=None):
    """Ejecuta el flujo completo y guarda los datos crudos. Devuelve la ruta del CSV."""
    driver = crear_driver(headless=False)
    wait = WebDriverWait(driver, 20)
    registros = []
    try:
        print(f"[+] Conectando al portal oficial: {URL_PORTAL}")
        driver.get(URL_PORTAL)
        esperar_intervencion_humana(driver)

        buscar(driver, wait, termino)
        aplicar_filtro_csv(driver, wait)

        print("[+] 3. Iniciando ciclo de extracción...")
        pagina = 1
        while True:
            print(f"\n[+] --- Extrayendo datos de la página {pagina} ---")
            registros.extend(extraer_pagina(driver, pagina))
            print(f"[+] {len(registros)} registros acumulados hasta ahora.")

            if max_paginas and pagina >= max_paginas:
                print("[+] Se alcanzó el límite de páginas solicitado.")
                break
            time.sleep(PAUSA_ENTRE_PAGINAS)
            if not ir_a_siguiente(driver, wait):
                print("[+] No hay botón de siguiente. Fin de los resultados.")
                break
            pagina += 1
            esperar_intervencion_humana(driver)
    except TimeoutException:
        print("[-] El portal tardó demasiado en responder; se guardará lo extraído hasta ahora.")
    finally:
        driver.quit()

    CARPETA_DATOS.mkdir(exist_ok=True)
    df = pd.DataFrame(registros)
    df.insert(0, "ID", range(1, len(df) + 1))
    df.to_csv(ARCHIVO_CRUDO, index=False, encoding="utf-8-sig")
    print(f"\n[+] {len(df)} registros crudos guardados en {ARCHIVO_CRUDO}")
    return ARCHIVO_CRUDO


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    limite = int(sys.argv[sys.argv.index("--max-paginas") + 1]) if "--max-paginas" in sys.argv else None
    if limite:
        args = [a for a in args if a != str(limite)]
    ejecutar_scraping(args[0] if args else "tecnologia", limite)
