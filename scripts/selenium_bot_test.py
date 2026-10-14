"""
Prueba de la defensa anti-bots contra el sitio LOCAL (http://localhost:3000).
Simula un bot con Selenium y muestra qué lo delata y cómo responde el servidor.

Uso:
    pip install selenium webdriver-manager
    npm run dev                         # en otra terminal
    python scripts/selenium_bot_test.py [--headless] [--fill-all]
"""
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:3000"
HEADLESS = "--headless" in sys.argv
sys.stdout.reconfigure(encoding="utf-8")

def make_driver():
    options = webdriver.ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    
    # Opciones opcionales para evitar bloqueos por tamaño de pantalla
    options.add_argument("--start-maximized")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    
    try:
        # Usa webdriver-manager para instalar y configurar ChromeDriver en automático
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    except Exception as e:
        print(f"Error al inicializar ChromeDriver: {type(e).__name__} - {e}")
        sys.exit("No se pudo iniciar el navegador automatizado.")

driver = make_driver()

try:
    print("Conectando al sitio local...")
    driver.get(f"{BASE_URL}/login")
    wait = WebDriverWait(driver, 15)
    
    # Espera a que carguen los campos del formulario
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "form input[type=email]")))
    time.sleep(2)  # Pausa breve para permitir que el hook asigne los atributos dinámicos

    print("\n== Huellas de automatización visibles desde JavaScript ==")
    print("navigator.webdriver   :", driver.execute_script("return navigator.webdriver"))
    print("navigator.userAgent   :", driver.execute_script("return navigator.userAgent"))
    print("navigator.languages   :", driver.execute_script("return navigator.languages"))
    print("navigator.plugins.len :", driver.execute_script("return navigator.plugins.length"))
    print("window.chrome         :", driver.execute_script("return typeof window.chrome"))

    print("\n== 1) Prueba de selectores estáticos vs dinámicos ==")
    try:
        driver.find_element(By.NAME, "email")
        print("Encontrado (los atributos NO son dinámicos)")
    except NoSuchElementException:
        print("ÉXITO DEFENSIVO: el atributo name cambia en cada carga ->",
              driver.find_element(By.CSS_SELECTOR, "input[type=email]").get_attribute("name"))

    print("\n== 2) El bot se adapta con un selector estructural y envía el formulario ==")
    email = driver.find_element(By.CSS_SELECTOR, "form input[type=email]")
    password = driver.find_element(By.CSS_SELECTOR, "form input[type=password]")
    
    email.send_keys("bot_automatico@example.com")
    password.send_keys("passwordSegura123")
    time.sleep(1)

    # Si se pasa el argumento --fill-all, simula un bot ingenuo que llena el honeypot oculto
    if "--fill-all" in sys.argv:
        print("[!] Activando modo bot agresivo (--fill-all): llenando campos trampa...")
        for inp in driver.find_elements(By.CSS_SELECTOR, "form input[type=text]"):
            driver.execute_script(
                "const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;"
                "set.call(arguments[0], 'http://spam-detectado');"
                "arguments[0].dispatchEvent(new Event('input', {bubbles: true}))", inp)

    # Clic en el botón de envío
    driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()
    time.sleep(2)

    try:
        alert = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "form .text-red-800")))
        print("Respuesta mostrada en pantalla:", alert.text)
    except Exception:
        print("No se localizó caja de texto de error visual.")

    try:
        q = driver.find_element(By.CSS_SELECTOR, "label[for=captcha-answer]")
        print("CAPTCHA exigido por el servidor :", q.text)
    except NoSuchElementException:
        print("El servidor aplicó bloqueo directo o no solicitó CAPTCHA en este intento.")

    print("\nPrueba de Selenium finalizada con éxito.")
    print("Revisa los registros perimetrales en tu entorno para validar la puntuación de riesgo.")

finally:
    time.sleep(3) # Pausa para que puedas ver el resultado en pantalla antes de que se cierre
    driver.quit()
