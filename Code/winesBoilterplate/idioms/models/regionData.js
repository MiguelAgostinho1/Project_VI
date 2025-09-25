// One cause entry
class Causa {
  constructor(causa, numero) {
    this.causa = causa;
    this.numero = numero;
  }
}

// One dimensão entry
class Dimensao {
  constructor(label, numero) {
    this.label = label;
    this.numero = numero;
  }
}

// Data for one region in a given year
class RegionData {
  constructor(region, area, percentagem, sapadores, eficaciaIndex, prevencaoIndex, total, causas, dimensoes) {
    this.region = region;
    this.area = area;
    this.percentagem = percentagem;
    this.sapadores = sapadores;
    this.eficaciaIndex = eficaciaIndex;
    this.prevencaoIndex = prevencaoIndex;
    this.total = total;

    // Default to empty array if undefined
    this.causas = (causas || []).map(c => new Causa(c.Causa, c.Numero));
    this.dimensoes = (dimensoes || []).map(d => new Dimensao(d.Dimensões, d.Numero));
  }
}