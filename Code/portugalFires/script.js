function init() {
  d3.json("./data/fires_data.json").then(function (data) {
    const structured_data = Object.entries(data).map(([year, regions]) => ({
        year,
        regions: Object.entries(regions).map(([regionName, regionData]) => new RegionData(
            regionName,
            regionData.Area,
            regionData.Percentagem,
            regionData.Sapadores,
            regionData.Eficacia_Index,
            regionData["Prevenção_Index"],
            regionData.Total,
            regionData.Causas,
            regionData.Dimensões
        ))
    }));

    const sharedState = new SharedState(structured_data, "Portugal", 0);

    createTitle(sharedState, ".Title");
    createChoroplethMap(sharedState, ".ChoroplethMap");
    createRadialBarchart(sharedState, ".RadialBarChart");
    createCausesDonutChart(sharedState, ".CausesDonutChart");
    createDimensionsDonutChart(sharedState, ".DimensionsDonutChart");
  });
}