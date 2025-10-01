const dimensionColors = [
    "#ffdc32", 
    "#ffcd5a",
    "#ffb93c",
    "#ffa528",
    "#ff911e",
    "#ff7314",
    "#ff550a",
    "#ff3700"
]

const causeColors = [
    "#ffff00",
    "#00ffff",
    "#9900ff",
    "#4cdc8b",
    "#741b47",
    "#999999"
]

// ========================
// Switch chart function
// ========================
// Title with arrows
let charts = ["dimensions", "causes"];
let currentChartIndex = 0; // começa em dimensions
function switchChart(direction) {
    currentChartIndex = (currentChartIndex + direction + charts.length) % charts.length;
    const currentChart = charts[currentChartIndex];

    d3.select(".CausesDonutChart").classed("active", currentChart === "causes");
    d3.select(".DimensionsDonutChart").classed("active", currentChart === "dimensions");

    titleText.text(
        currentChart === "causes" ? "Causes of Fires" : "Dimensions of Fires"
    );
}