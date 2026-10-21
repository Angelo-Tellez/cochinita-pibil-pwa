"""
Verificación de la persistencia: consulta la base SQLite generada por limpieza_pandas.py.

Uso:
    python scripts/consultar_bd.py
"""
import sqlite3
import sys
from pathlib import Path

import pandas as pd

ARCHIVO_BD = Path(__file__).resolve().parent.parent / "data" / "porke_datos.db"

CONSULTAS = {
    "Total de platillos almacenados":
        "SELECT COUNT(*) AS total FROM productos",
    "Resumen por categoría":
        """SELECT Categoria, COUNT(*) AS platillos, ROUND(AVG(Precio), 2) AS precio_promedio,
                  MIN(Precio) AS min, MAX(Precio) AS max
           FROM productos GROUP BY Categoria ORDER BY platillos DESC""",
    "Top 5 platillos con más calorías":
        "SELECT Platillo, Categoria, Calorias, Precio FROM productos ORDER BY Calorias DESC LIMIT 5",
    "Bitácora de ejecuciones del pipeline":
        "SELECT * FROM ejecuciones ORDER BY id DESC LIMIT 5",
}

# Solo se ejecutan si ya se corrió la extracción del portal oficial
CONSULTAS_DATOSGOB = {
    "datos.gob.mx: total de conjuntos almacenados":
        "SELECT COUNT(*) AS total FROM conjuntos_datos",
    "datos.gob.mx: top 5 instituciones con más conjuntos":
        """SELECT Institucion, COUNT(*) AS conjuntos, SUM(Num_Bases) AS bases
           FROM conjuntos_datos GROUP BY Institucion ORDER BY conjuntos DESC LIMIT 5""",
}


def main():
    if not ARCHIVO_BD.exists():
        sys.exit("[-] No existe la base de datos. Ejecuta primero limpieza_pandas.py")
    with sqlite3.connect(ARCHIVO_BD) as con:
        tablas = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        consultas = {**CONSULTAS, **(CONSULTAS_DATOSGOB if "conjuntos_datos" in tablas else {})}
        for titulo, sql in consultas.items():
            print(f"\n=== {titulo} ===")
            print(pd.read_sql_query(sql, con).to_string(index=False))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    pd.set_option("display.max_colwidth", 60)
    main()
