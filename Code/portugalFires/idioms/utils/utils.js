const dimensionColors = [
    "#ffdc32", // amarelo claro
    "#ffcd5a", // amarelo mais forte
    "#ffb93c", // laranja claro
    "#ffa528", // laranja
    "#ff911e", // laranja mais escuro
    "#e94d00", // vermelho-alaranjado escuro
    "#cc2500", // vermelho escuro
    "#990000"  // vermelho profundo
];

const causeColors = [
    "#ffd84d",
    "#5bc0de",
    "#8e5ad1",
    "#5cb85c",
    "#8b4513",
    "#999999"
];

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