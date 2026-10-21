"""
Limpieza, estructuración y persistencia de los datos extraídos de datos.gob.mx.

Entrada:  data/datosgob_crudo.csv   (generado por scraping_datosgob.py)
Salidas:  data/datosgob_limpio.csv  (CSV, abre directo en Excel)
          data/datosgob_limpio.xlsx (Excel con hoja de datos y hoja de resumen)
          data/porke_datos.db       (tabla conjuntos_datos + registro en ejecuciones)

Uso:
    python scripts/limpieza_datosgob.py
"""
import sqlite3
import sys

import pandas as pd

from limpieza_pandas import ARCHIVO_BD, CARPETA_DATOS, registrar_ejecucion

ARCHIVO_CRUDO = CARPETA_DATOS / "datosgob_crudo.csv"
ARCHIVO_CSV = CARPETA_DATOS / "datosgob_limpio.csv"
ARCHIVO_EXCEL = CARPETA_DATOS / "datosgob_limpio.xlsx"

MESES = {"enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
         "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12}

COLUMNAS_FINALES = ["ID", "Conjunto_Datos", "Institucion", "Categoria", "Ultima_Actualizacion",
                    "Num_Bases", "URL_Origen", "Pagina", "Fecha_Captura"]


def fecha_es_a_datetime(texto):
    """Convierte '8 de octubre 2026' (formato del portal) a un Timestamp de Pandas."""
    if not isinstance(texto, str):
        return pd.NaT
    partes = texto.lower().replace(" de ", " ").split()
    try:
        return pd.Timestamp(year=int(partes[2]), month=MESES[partes[1]], day=int(partes[0]))
    except (IndexError, KeyError, ValueError):
        return pd.NaT


def limpiar(df_crudo):
    """Aplica las reglas de limpieza y devuelve un DataFrame estructurado."""
    df = df_crudo.copy()

    # 1. Eliminar registros sin los campos obligatorios
    df = df.dropna(subset=["Conjunto_Datos", "URL_Origen"])

    # 2. Conservar solo enlaces a conjuntos de datos reales y quitar duplicados
    df = df[df["URL_Origen"].str.contains("/dataset/", case=False, na=False)]
    df = df.drop_duplicates(subset="URL_Origen")

    # 3. Normalización de texto
    for col in ["Conjunto_Datos", "Institucion", "Categoria"]:
        df[col] = df[col].fillna("Sin dato").astype(str).str.strip().str.replace(r"\s+", " ", regex=True)

    # 4. Conversión de tipos: entero, fecha del portal y fecha de captura
    df = df.assign(
        Num_Bases=pd.to_numeric(df["Num_Bases"], errors="coerce").fillna(0).astype(int),
        Ultima_Actualizacion=df["Ultima_Actualizacion"].map(fecha_es_a_datetime),
        Fecha_Captura=pd.to_datetime(df["Fecha_Captura"]),
    )

    # 5. Ordenar y restaurar índices
    df = df.sort_values("Ultima_Actualizacion", ascending=False).reset_index(drop=True)
    df["ID"] = df.index + 1
    return df[COLUMNAS_FINALES]


def resumen_por_institucion(df):
    return (df.groupby("Institucion")
              .agg(Conjuntos=("ID", "count"), Bases_Totales=("Num_Bases", "sum"))
              .sort_values("Conjuntos", ascending=False)
              .reset_index())


def guardar(df, total_crudos):
    """Persiste en CSV, Excel y SQLite."""
    df.to_csv(ARCHIVO_CSV, index=False, encoding="utf-8-sig")
    with pd.ExcelWriter(ARCHIVO_EXCEL, engine="openpyxl") as excel:
        df.to_excel(excel, sheet_name="Datos_Limpios", index=False)
        resumen_por_institucion(df).to_excel(excel, sheet_name="Resumen_Instituciones", index=False)

    with sqlite3.connect(ARCHIVO_BD) as con:
        df.assign(
            Ultima_Actualizacion=df["Ultima_Actualizacion"].dt.strftime("%Y-%m-%d"),
            Fecha_Captura=df["Fecha_Captura"].dt.strftime("%Y-%m-%d %H:%M:%S"),
        ).to_sql("conjuntos_datos", con, if_exists="replace", index=False)
        con.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_url ON conjuntos_datos(URL_Origen)")
        registrar_ejecucion(con, "datos.gob.mx", total_crudos, len(df))


def procesar_datos():
    print("[+] Iniciando estructuración con Pandas (datos.gob.mx)...")
    try:
        df_crudo = pd.read_csv(ARCHIVO_CRUDO)
    except FileNotFoundError:
        print("[-] Falta el archivo crudo. Ejecuta primero scraping_datosgob.py")
        return None

    df = limpiar(df_crudo)

    print("\n=== CONJUNTOS PROCESADOS (primeros 15) ===")
    print(df[["ID", "Conjunto_Datos", "Institucion", "Ultima_Actualizacion"]].head(15).to_string(index=False))
    print(f"\nRegistros crudos: {len(df_crudo)}  ->  registros válidos: {len(df)} "
          f"({len(df_crudo) - len(df)} descartados por nulos o duplicados)")
    df.info()

    guardar(df, len(df_crudo))
    print("\n[+] Persistencia completada:")
    for ruta in (ARCHIVO_CSV, ARCHIVO_EXCEL, ARCHIVO_BD):
        print(f"    - {ruta}")
    return df


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    procesar_datos()
