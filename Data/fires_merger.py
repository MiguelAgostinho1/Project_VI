import json

# Load all JSON files
with open("./Causa/fires_causes.json", "r", encoding="utf-8") as f:
    causas = json.load(f)

with open("./Dimensao/fires_dimensions.json", "r", encoding="utf-8") as f:
    dimensoes = json.load(f)

with open("./Proporção/fires_percent.json", "r", encoding="utf-8") as f:
    percentagens = json.load(f)

with open("./Sapadores/fires_sappers.json", "r", encoding="utf-8") as f:
    sapadores = json.load(f)

# Initialize result
merged = {}

# Collect and sort all years in descending order
all_years = sorted(
    {int(y) for y in (list(causas.keys()) + list(dimensoes.keys()) + list(percentagens.keys()) + list(sapadores.keys()))},
    reverse=True
)

for year in all_years:
    year = str(year)  # keep keys as strings in final JSON
    merged[year] = {}
    
    # Collect all regions for this year
    regions = set()
    for dataset in [causas, dimensoes, percentagens, sapadores]:
        if year in dataset:
            regions |= set(dataset[year].keys())
    
    # Sort regions alphabetically for readability
    for region in sorted(regions):
        merged[year][region] = {}

        # Add percentagens data
        if year in percentagens and region in percentagens[year]:
            merged[year][region]["Percentagem"] = percentagens[year][region]

        # Add sapadores data
        if year in sapadores and region in sapadores[year]:
            merged[year][region]["Sapadores"] = sapadores[year][region]
        
        # Add causas data
        if year in causas and region in causas[year]:
            merged[year][region]["Total"] = causas[year][region].get("Total")
            merged[year][region]["Causas"] = causas[year][region].get("Causas", [])
        
        # Add dimensões data
        if year in dimensoes and region in dimensoes[year]:
            merged[year][region]["Dimensões"] = dimensoes[year][region].get("Dimensões", [])

# Save merged result
with open("fires_merged.json", "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
