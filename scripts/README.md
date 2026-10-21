# Scripts de extracción y automatización (TAD T2_3)

Todos los scripts trabajan sobre el sitio propio **Porké**, ya sea local (`npm run dev`) o publicado en Vercel (`--vercel`).

| Archivo | Responsabilidad |
| --- | --- |
| `navegador.py` | Crea el WebDriver (Chrome con webdriver-manager, o Edge como respaldo). |
| `selenium_bot_test.py` | Ataca las defensas de Porké: carga diferida, IDs dinámicos, honeypot, casilla "No soy un robot", CSRF y rate limiting. |
| `scraping_porke.py` | Extrae el menú: categorías de la portada y detalle de cada platillo. Guarda `data/menu_crudo.csv`. |
| `limpieza_pandas.py` | Limpia el menú con Pandas y lo persiste en CSV, Excel y SQLite. |
| `scraping_datosgob.py` | Extrae del portal oficial datos.gob.mx: búsqueda, filtro CSV y paginación. Guarda `data/datosgob_crudo.csv`. |
| `limpieza_datosgob.py` | Limpia los datos del portal y los persiste en CSV, Excel y la tabla `conjuntos_datos`. |
| `consultar_bd.py` | Consulta la base SQLite para verificar la persistencia. |
| `pipeline_e2e.py` | Ejecuta todo el flujo de principio a fin. |

## Instalación

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r scripts/requirements.txt
```

## Ejecución

```bash
npm run dev                                  # terminal 1: sitio en http://localhost:3000
python scripts/pipeline_e2e.py               # terminal 2: flujo completo en local
python scripts/pipeline_e2e.py --vercel      # o contra https://cochinita-pibil-pwa.vercel.app
```

Cada etapa también se puede correr por separado (todas aceptan `--vercel` o `--url <URL>`):

```bash
python scripts/selenium_bot_test.py              # bot que recibe CAPTCHA
python scripts/selenium_bot_test.py --fill-all   # bot que llena el honeypot y es bloqueado (403)
python scripts/selenium_bot_test.py --rafaga     # POST sin token CSRF -> 403, ráfaga -> HTTP 429
python scripts/selenium_bot_test.py --casilla    # clic de bot en la casilla de /contact -> escala a otro reto
python scripts/scraping_porke.py
python scripts/scraping_datosgob.py [termino] [--max-paginas N]
python scripts/limpieza_datosgob.py
python scripts/limpieza_pandas.py
python scripts/consultar_bd.py
```

## Datos generados (`data/`)

| Archivo | Contenido |
| --- | --- |
| `menu_crudo.csv` | Platillos tal como se extrajeron del sitio. |
| `menu_limpio.csv` | Platillos válidos con precio, calorías y fechas ya convertidos. |
| `menu_limpio.xlsx` | Hoja `Menu_Limpio` y hoja `Resumen_Categorias`. |
| `datosgob_crudo.csv`, `datosgob_limpio.csv`, `datosgob_limpio.xlsx` | Conjuntos de datos extraídos de datos.gob.mx (crudos y limpios). |
| `porke_datos.db` | SQLite: tablas `productos` (menú), `conjuntos_datos` (datos.gob.mx) y `ejecuciones` (bitácora con la fuente de cada corrida). |

## Consideraciones

- Pausa de 1.5 s entre páginas de Porké y de 3 s entre páginas de datos.gob.mx.
- datos.gob.mx está detrás de Akamai, que rechaza navegadores headless; el scraper usa ventana visible y, ante un bloqueo, pide intervención humana en lugar de evadirlo.
- `pipeline_e2e.py --sin-datosgob` omite las etapas del portal oficial.
- El catálogo es público a propósito (los clientes y buscadores deben verlo). Las defensas anti-bot protegen los formularios de login y registro.
- En local, cada intento del bot queda registrado en `logs/bot-audit.log`. En Vercel queda en los logs de la función.
