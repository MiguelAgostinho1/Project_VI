import pandas as pd
import json
import re

# Load CSV (skip header rows, fix encoding)
df = pd.read_csv(
    "Incendios_proporcao_2010-2024.csv",
    sep=";",
    header=None,
    skiprows=5,
    encoding="latin1"
)

# Keep only rows that look like "NUTS: Region"
df = df[df[0].str.match(r"^[0-9A-Z]+:") == True]

# Clean region names (remove NUTS codes but keep text)
df[0] = df[0].astype(str).str.replace(r"^[0-9A-Z]+: ?", "", regex=True).str.strip()

# Years available (2024–2010)
years = list(range(2024, 2009, -1))

result = {}

for _, row in df.iterrows():
    region = row[0]
    values = row[1:].tolist()
    
    for i, year in enumerate(years):
        val = values[i]
        try:
            numero = float(str(val).replace("&", "").replace(",", ".").strip())
        except:
            numero = None
        
        if str(year) not in result:
            result[str(year)] = {}
        
        result[str(year)][region] = numero

# Export to JSON
with open("incendios_percent.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
