"""
Prueba de la defensa anti-bots del sitio Porké (local o publicado en Vercel).
Simula un bot con Selenium y muestra qué lo delata y cómo responde el servidor.

Uso:
    pip install -r scripts/requirements.txt
    npm run dev                         # en otra terminal
    python scripts/selenium_bot_test.py [--headless] [--fill-all] [--vercel | --url <URL>]
    python scripts/selenium_bot_test.py --rafaga   # CSRF (403) y rate limiting (HTTP 429)
    python scripts/selenium_bot_test.py --casilla  # bot contra la casilla "No soy un robot" de /contact
"""
import json
import sys
import time
import urllib.error
import urllib.request

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from navegador import crear_driver
from scraping_porke import URL_LOCAL, url_desde_argumentos


def imprimir_huellas(driver):
    """Muestra las propiedades de JavaScript que delatan al navegador automatizado."""
    print("\n== Huellas de automatización visibles desde JavaScript ==")
    print("navigator.webdriver   :", driver.execute_script("return navigator.webdriver"))
    print("navigator.userAgent   :", driver.execute_script("return navigator.userAgent"))
    print("navigator.languages   :", driver.execute_script("return navigator.languages"))
    print("navigator.plugins.len :", driver.execute_script("return navigator.plugins.length"))
    print("window.chrome         :", driver.execute_script("return typeof window.chrome"))


def llenar_honeypot(driver):
    """Bot ingenuo: llena también los campos ocultos (trampa) del formulario."""
    print("[!] Activando modo bot agresivo (--fill-all): llenando campos trampa...")
    for inp in driver.find_elements(By.CSS_SELECTOR, "form input[type=text]"):
        driver.execute_script(
            "const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;"
            "set.call(arguments[0], 'http://spam-detectado');"
            "arguments[0].dispatchEvent(new Event('input', {bubbles: true}))", inp)


def leer_respuesta(driver, wait):
    """Lee lo que el servidor mostró en pantalla y devuelve 'bloqueado', 'captcha' o 'sin_respuesta'."""
    resultado = "sin_respuesta"
    try:
        wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, "form .text-red-800, [data-captcha-type]"))
    except Exception:
        print("El servidor no mostró respuesta visual.")
        return resultado

    errores = driver.find_elements(By.CSS_SELECTOR, "form .text-red-800")
    if errores:
        print("Respuesta mostrada en pantalla:", errores[0].text)
        resultado = "bloqueado"

    widgets = driver.find_elements(By.CSS_SELECTOR, "[data-captcha-type]")
    if widgets:
        print("CAPTCHA exigido por el servidor :", widgets[0].get_attribute("data-captcha-type"))
        resultado = "captcha"
    else:
        print("El servidor aplicó bloqueo directo sin ofrecer CAPTCHA.")
    return resultado


def ejecutar_prueba(base_url=URL_LOCAL, fill_all=False, headless=False):
    """Ejecuta un intento de login automatizado y devuelve cómo respondió el sitio."""
    driver = crear_driver(headless)
    try:
        print(f"Conectando a {base_url}/login ...")
        driver.get(f"{base_url}/login")
        wait = WebDriverWait(driver, 15)

        # El formulario no viene en el HTML: se carga después por fetch (/api/form-session)
        html_inicial = driver.page_source
        print("¿El HTML inicial ya trae el input de email?:", 'type="email"' in html_inicial)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "form input[type=email]")))

        imprimir_huellas(driver)

        print("\n== 1) Prueba de selectores estáticos vs dinámicos ==")
        try:
            driver.find_element(By.NAME, "email")
            print("Encontrado (los atributos NO son dinámicos)")
        except NoSuchElementException:
            print("ÉXITO DEFENSIVO: el atributo name cambia en cada carga ->",
                  driver.find_element(By.CSS_SELECTOR, "input[type=email]").get_attribute("name"))

        print("\n== 2) El bot se adapta con un selector estructural y envía el formulario ==")
        driver.find_element(By.CSS_SELECTOR, "form input[type=email]").send_keys("bot_automatico@example.com")
        driver.find_element(By.CSS_SELECTOR, "form input[type=password]").send_keys("passwordSegura123")
        time.sleep(1)

        if fill_all:
            llenar_honeypot(driver)

        driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()
        time.sleep(2)

        resultado = leer_respuesta(driver, wait)
        print("\nPrueba de Selenium finalizada. En local, revisa logs/bot-audit.log para ver la puntuación de riesgo.")
        return resultado
    finally:
        time.sleep(3)  # Pausa para ver el resultado en pantalla antes de que se cierre
        driver.quit()


def _post(base_url, ruta, cuerpo, cabeceras):
    req = urllib.request.Request(f"{base_url}{ruta}", data=json.dumps(cuerpo).encode(), method="POST",
                                 headers={"Content-Type": "application/json", **cabeceras})
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, res.headers
    except urllib.error.HTTPError as e:
        return e.code, e.headers


def prueba_rafaga(base_url=URL_LOCAL, intentos=8):
    """Prueba CSRF (POST sin token) y luego una ráfaga con token válido para disparar el rate limit (429)."""
    # Sesión legítima: cookie httpOnly + token CSRF ligado a ella
    with urllib.request.urlopen(f"{base_url}/api/session") as res:
        cookie = res.headers.get("Set-Cookie", "").split(";")[0]
        token = json.loads(res.read())["csrfToken"]

    print("\n== 3) CSRF: POST a /api/verify-human sin token ==")
    codigo, cab = _post(base_url, "/api/verify-human", {"form": "login"}, {"Cookie": cookie})
    print(f"Sin X-CSRF-Token: HTTP {codigo} (X-CSRF-Error: {cab.get('X-CSRF-Error')})")

    print(f"\n== 4) Ráfaga de {intentos} peticiones seguidas con token válido ==")
    codigos = []
    for i in range(1, intentos + 1):
        codigo, cab = _post(base_url, "/api/verify-human", {"form": "login", "signals": {}},
                            {"Cookie": cookie, "X-CSRF-Token": token})
        codigos.append(codigo)
        extra = f"  (Retry-After: {cab.get('Retry-After')} s)" if codigo == 429 else ""
        print(f"Petición {i}: HTTP {codigo}{extra}")
    return codigos


def prueba_casilla(base_url=URL_LOCAL, headless=False):
    """Bot contra la casilla "No soy un robot" del formulario de contacto.
    ActionChains genera clics con isTrusted = true, pero salta directo a la casilla:
    el servidor ve la trayectoria y escala a un reto de imágenes o puzzle."""
    driver = crear_driver(headless)
    try:
        driver.get(f"{base_url}/contact")
        wait = WebDriverWait(driver, 15)
        casilla = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-captcha-type=checkbox] [role=checkbox]")))

        print("\n== 5) El bot llena el formulario de contacto y marca la casilla ==")
        driver.find_element(By.CSS_SELECTOR, "form input:not([type=email]):not([tabindex='-1'])").send_keys("Bot Automático")
        driver.find_element(By.CSS_SELECTOR, "form input[type=email]").send_keys("bot@example.com")
        driver.find_element(By.CSS_SELECTOR, "form textarea").send_keys("Mensaje enviado por un script de Selenium.")
        time.sleep(1)
        ActionChains(driver).move_to_element(casilla).click().perform()

        wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, "[data-captcha-error], [data-captcha-state=passed]"))
        errores = driver.find_elements(By.CSS_SELECTOR, "[data-captcha-error]")
        if errores:
            nuevo = driver.find_element(By.CSS_SELECTOR, "[data-captcha-type]").get_attribute("data-captcha-type")
            print("Respuesta del servidor:", errores[0].text)
            print("Reto escalado a       :", nuevo)
            return "escalado"
        print("La casilla aceptó el clic del bot.")
        return "aprobado"
    finally:
        time.sleep(3)
        driver.quit()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    url = url_desde_argumentos(sys.argv)
    if "--rafaga" in sys.argv:
        prueba_rafaga(url)
    elif "--casilla" in sys.argv:
        prueba_casilla(url, headless="--headless" in sys.argv)
    else:
        ejecutar_prueba(url, fill_all="--fill-all" in sys.argv, headless="--headless" in sys.argv)
