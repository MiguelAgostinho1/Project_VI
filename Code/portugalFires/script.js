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

    createRadialBarchart(structured_data, ".RadialBarChart");
    // createScatterplot(structured_data, ".ScatterPlot");
    // createHistogram(structured_data, ".Histogram");
    // createSunburst(structured_data, ".Sunburst");
    // createLinechart(structured_data, ".LineChart");
  });
}