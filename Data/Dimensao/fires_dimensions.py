import pandas as pd
import json

# Load CSV (fixed skiprows + encoding)
df = pd.read_csv(
    "Incendios_dimensao_2010-2024.csv",
    sep=";",
    header=None,
    skiprows=5,
    encoding="latin1"
)

# Clean region names (remove NUTS codes but keep first letter)
df[0] = df[0].astype(str).str.replace(r"^[0-9A-Z]+: ?", "", regex=True).str.strip()

# Drop invalid rows
df = df[df[0].notna()]
df = df[~df[0].str.lower().eq("nan")]
df = df[~df[0].str.contains("Localização", na=False)]

# Define causes order (exclude Total here)
dimensions = ["< 1 ha", "1 - < 10 ha", "10 - < 20 ha", "20 - < 50 ha", "50 - < 100 ha", "100 - < 500 ha", "500 - < 1 000 ha", ">= 1 000 ha"]

# Years available
years = list(range(2024, 2009, -1))

result = {}

for _, row in df.iterrows():
    region = row[0]
    values = row[1:].tolist()
    
    for i, year in enumerate(years):
        offset = i * (len(dimensions) + 1)  # +1 because Total is in the CSV
        year_values = values[offset:offset + len(dimensions) + 1]
        
        if not all(pd.isna(v) or str(v).strip() in ["x x", "NaN"] for v in year_values):
            if str(year) not in result:
                result[str(year)] = {}

            # First value = Total
            try:
                total_val = int(str(year_values[0]).replace("&", "").strip())
            except:
                total_val = None

            dimensions_list = []
            for causa, numero in zip(dimensions, year_values[1:]):
                try:
                    numero = int(str(numero).replace("&", "").strip())
                except:
                    numero = None
                dimensions_list.append({"Dimensões": causa, "Numero": numero})
            
            result[str(year)][region] = {
                "Total": total_val,
                "Dimensões": dimensions_list
            }

with open("fires_dimensions.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
