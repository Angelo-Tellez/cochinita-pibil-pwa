"""
Limpieza, estructuración y persistencia del menú extraído del sitio Porké.

Entrada:  data/menu_crudo.csv    (generado por scraping_porke.py)
Salidas:  data/menu_limpio.csv   (CSV, abre directo en Excel)
          data/menu_limpio.xlsx  (Excel con hoja de menú y hoja de resumen por categoría)
          data/porke_datos.db    (base SQLite: tablas productos y ejecuciones)

Uso:
    python scripts/limpieza_pandas.py
"""
import sqlite3
import sys
from pathlib import Path

import pandas as pd

CARPETA_DATOS = Path(__file__).resolve().parent.parent / "data"
ARCHIVO_CRUDO = CARPETA_DATOS / "menu_crudo.csv"
ARCHIVO_CSV = CARPETA_DATOS / "menu_limpio.csv"
ARCHIVO_EXCEL = CARPETA_DATOS / "menu_limpio.xlsx"
ARCHIVO_BD = CARPETA_DATOS / "porke_datos.db"
PRECIO_MINIMO = 0.50  # ningún platillo real cuesta menos; debajo de esto es un registro de prueba

COLUMNAS_FINALES = ["ID", "Producto_ID", "Categoria", "Platillo", "Descripcion", "Precio",
                    "Calorias", "Porcion", "Num_Ingredientes", "Ingredientes", "Detalles",
                    "URL_Origen", "Fecha_Captura"]


def limpiar(df_crudo):
    """Aplica las reglas de limpieza y devuelve un DataFrame estructurado."""
    df = df_crudo.copy()

    # 1. Eliminar registros sin los campos obligatorios
    df = df.dropna(subset=["Platillo", "Precio", "URL_Origen"])

    # 2. Conservar solo enlaces a productos y quitar duplicados por su ID en Firestore
    df = df[df["URL_Origen"].str.contains("/products/", na=False)]
    df["Producto_ID"] = df["URL_Origen"].str.rsplit("/", n=1).str[-1]
    df = df.drop_duplicates(subset="Producto_ID")

    # 3. Normalización de texto
    for col in ["Categoria", "Platillo", "Descripcion", "Porcion", "Ingredientes", "Detalles"]:
        df[col] = df[col].fillna("Sin dato").astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

    # 4. Conversión de tipos: "$8.49" -> 8.49, "450 cal" -> 450, texto -> datetime
    df = df.assign(
        Precio=pd.to_numeric(df["Precio"].str.replace(r"[^\d.]", "", regex=True), errors="coerce"),
        Calorias=pd.to_numeric(df["Calorias"].astype(str).str.extract(r"(\d+)")[0], errors="coerce").astype("Int64"),
        Fecha_Captura=pd.to_datetime(df["Fecha_Captura"]),
    )
    df = df.dropna(subset=["Precio"])

    # 5. Descartar registros de prueba capturados en el panel de administración
    es_prueba = (df["Platillo"].str.contains(r"\b(?:prueba|test)\b", case=False, regex=True)
                 | (df["Precio"] < PRECIO_MINIMO))
    for _, fila in df[es_prueba].iterrows():
        print(f"[!] Registro de prueba descartado: '{fila['Platillo']}' (${fila['Precio']:.2f})")
    df = df[~es_prueba]

    # 6. Columna derivada: número de ingredientes de la lista separada por comas
    df["Num_Ingredientes"] = df["Ingredientes"].map(
        lambda t: 0 if t == "Sin dato" else len([i for i in t.split(",") if i.strip()]))

    # 7. Ordenar y restaurar índices
    df = df.sort_values(["Categoria", "Precio"]).reset_index(drop=True)
    df["ID"] = df.index + 1
    return df[COLUMNAS_FINALES]


def resumen_por_categoria(df):
    return (df.groupby("Categoria")
              .agg(Platillos=("ID", "count"), Precio_Promedio=("Precio", "mean"),
                   Precio_Min=("Precio", "min"), Precio_Max=("Precio", "max"),
                   Calorias_Promedio=("Calorias", "mean"))
              .round(2)
              .reset_index())


def guardar_csv_excel(df):
    df.to_csv(ARCHIVO_CSV, index=False, encoding="utf-8-sig")
    with pd.ExcelWriter(ARCHIVO_EXCEL, engine="openpyxl") as excel:
        df.to_excel(excel, sheet_name="Menu_Limpio", index=False)
        resumen_por_categoria(df).to_excel(excel, sheet_name="Resumen_Categorias", index=False)


def registrar_ejecucion(con, fuente, total_crudos, total_limpios):
    """Agrega una fila a la bitácora de ejecuciones (la tabla nunca se reemplaza)."""
    con.execute("""CREATE TABLE IF NOT EXISTS ejecuciones (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       fecha TEXT DEFAULT (datetime('now', 'localtime')),
                       fuente TEXT,
                       registros_crudos INTEGER,
                       registros_limpios INTEGER)""")
    con.execute("INSERT INTO ejecuciones (fuente, registros_crudos, registros_limpios) VALUES (?, ?, ?)",
                (fuente, total_crudos, total_limpios))


def guardar_sqlite(df, total_crudos):
    """Carga los datos limpios a SQLite y registra la ejecución en una bitácora."""
    with sqlite3.connect(ARCHIVO_BD) as con:
        df.assign(Fecha_Captura=df["Fecha_Captura"].dt.strftime("%Y-%m-%d %H:%M:%S")) \
          .to_sql("productos", con, if_exists="replace", index=False)
        con.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_producto ON productos(Producto_ID)")
        registrar_ejecucion(con, "Porké", total_crudos, len(df))


def procesar_datos():
    print("[+] Iniciando estructuración con Pandas...")
    try:
        df_crudo = pd.read_csv(ARCHIVO_CRUDO)
    except FileNotFoundError:
        print("[-] Falta el archivo crudo. Ejecuta primero scraping_porke.py")
        return None

    df = limpiar(df_crudo)

    print("\n=== MENÚ PROCESADO ===")
    print(df[["ID", "Categoria", "Platillo", "Precio", "Calorias", "Num_Ingredientes"]].to_string(index=False))
    print("\n=== INFORMACIÓN TÉCNICA DEL DATAFRAME ===")
    print(f"Registros crudos: {len(df_crudo)}  ->  registros válidos: {len(df)} "
          f"({len(df_crudo) - len(df)} descartados por nulos, duplicados o registros de prueba)")
    df.info()

    guardar_csv_excel(df)
    guardar_sqlite(df, len(df_crudo))
    print("\n[+] Persistencia completada:")
    for ruta in (ARCHIVO_CSV, ARCHIVO_EXCEL, ARCHIVO_BD):
        print(f"    - {ruta}")
    return df


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    procesar_datos()
