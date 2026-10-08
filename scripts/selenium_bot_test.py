"""
Prueba de la defensa anti-bots contra el sitio LOCAL (http://localhost:3000).
Simula un bot con Selenium y muestra qué lo delata y cómo responde el servidor.

Uso:
    pip install selenium
    npm run dev            # en otra terminal
    python scripts/selenium_bot_test.py [--headless]
"""
import sys
import time

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:3000"
HEADLESS = "--headless" in sys.argv
sys.stdout.reconfigure(encoding="utf-8")

def make_driver():
    # Usa Chrome si está instalado; si no, Edge (ambos son Chromium)
    for Options, Driver in ((webdriver.ChromeOptions, webdriver.Chrome), (webdriver.EdgeOptions, webdriver.Edge)):
        options = Options()
        if HEADLESS:
            options.add_argument("--headless=new")
        try:
            return Driver(options=options)
        except Exception as e:
            print(f"{Driver.__name__} no disponible: {type(e).__name__}")
    sys.exit("No se encontró Chrome ni Edge")


driver = make_driver()

try:
    driver.get(f"{BASE_URL}/login")
    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "form input[type=email]")))
    time.sleep(1)  # deja que el hook aleatorice los name/id

    print("== Huellas de automatización visibles desde JavaScript")
    print("navigator.webdriver   :", driver.execute_script("return navigator.webdriver"))
    print("navigator.userAgent   :", driver.execute_script("return navigator.userAgent"))
    print("navigator.languages   :", driver.execute_script("return navigator.languages"))
    print("navigator.plugins.len :", driver.execute_script("return navigator.plugins.length"))
    print("window.chrome         :", driver.execute_script("return typeof window.chrome"))

    print("\n== 1) Localizador estático By.NAME('email')")
    try:
        driver.find_element(By.NAME, "email")
        print("Encontrado (los atributos NO son dinámicos)")
    except NoSuchElementException:
        print("FALLA: el atributo name cambia en cada carga ->",
              driver.find_element(By.CSS_SELECTOR, "input[type=email]").get_attribute("name"))

    print("\n== 2) El bot se adapta con un selector estructural y envía el formulario")
    email = driver.find_element(By.CSS_SELECTOR, "form input[type=email]")
    password = driver.find_element(By.CSS_SELECTOR, "form input[type=password]")
    email.send_keys("bot@example.com")
    password.send_keys("contrasena-falsa")

    # Un bot ingenuo llena TODOS los inputs, incluido el honeypot oculto
    if "--fill-all" in sys.argv:
        for inp in driver.find_elements(By.CSS_SELECTOR, "form input[type=text]"):
            # React ignora `el.value = x`; se usa el setter nativo para que registre el cambio
            driver.execute_script(
                "const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;"
                "set.call(arguments[0], 'http://spam');"
                "arguments[0].dispatchEvent(new Event('input', {bubbles: true}))", inp)

    driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()

    alert = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "form .text-red-800")))
    print("Respuesta mostrada:", alert.text)
    try:
        q = driver.find_element(By.CSS_SELECTOR, "label[for=captcha-answer]")
        print("CAPTCHA exigido     :", q.text)
    except NoSuchElementException:
        print("No se pidió CAPTCHA")

    print("\nRevisa logs/bot-audit.log para ver la puntuación y las razones registradas en el servidor.")
finally:
    driver.quit()
