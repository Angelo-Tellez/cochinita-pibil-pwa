"""
Creación del navegador automatizado que comparten todos los scripts.

Intenta primero con Chrome (webdriver-manager) y, si no está instalado,
usa Microsoft Edge (Selenium Manager descarga msedgedriver en automático).
"""
import sys

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


def _configurar(options, headless):
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    return options


def crear_driver(headless=False):
    """Devuelve un WebDriver listo para usarse (Chrome o, en su defecto, Edge)."""
    try:
        return webdriver.Chrome(service=Service(ChromeDriverManager().install()),
                                options=_configurar(webdriver.ChromeOptions(), headless))
    except Exception as e:
        print(f"No se pudo iniciar Chrome ({type(e).__name__}). Intentando con Microsoft Edge...")

    try:
        return webdriver.Edge(options=_configurar(webdriver.EdgeOptions(), headless))
    except Exception as e:
        print(f"Error al inicializar EdgeDriver: {type(e).__name__} - {e}")
        sys.exit("No se pudo iniciar el navegador automatizado.")
