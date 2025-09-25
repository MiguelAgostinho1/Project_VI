function init() {
  d3.json("./data/fires_data.json").then(function (data) {
    createRadialBarchart(data, ".RadialBarChart");
    // createScatterplot(data, ".ScatterPlot");
    // createHistogram(data, ".Histogram");
    // createSunburst(data, ".Sunburst");
    // createLinechart(data, ".LineChart");
  });
}