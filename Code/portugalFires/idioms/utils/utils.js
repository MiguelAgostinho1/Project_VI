// ========================
// Donut chart colors
// ========================
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

// ========================
// Choropleth map colors
// ========================
const missingDataColor = "#ccc";
const lowRiskColor = "#1a987dff";
const mediumRiskColor = "#ffa528";
const highRiskColor = "#990000";

function getPreventionColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    if (value <= 0.009) return highRiskColor;
    if (value < 0.1) return mediumRiskColor;
    return lowRiskColor;
}  

 function getEfficiencyColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    if (value <= 0.009) return highRiskColor;
    if (value < 0.1) return mediumRiskColor;
    return lowRiskColor;
}

function getPercentageColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    if (value <= 1.99) return lowRiskColor;
    if (value < 2.5) return mediumRiskColor;
    return highRiskColor;
}

 function getTotalFiresColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    if (value <= 199) return lowRiskColor;
    if (value <= 500) return mediumRiskColor;
    return highRiskColor;
}

 function getColor(value, currentFilter) {
    switch (currentFilter) {
        case "Efficiency Index":
            return getEfficiencyColor(value);
        case "Percentage Burned":
            return getPercentageColor(value);
        case "Prevention Index":
            return getPreventionColor(value);
        default:
            return getTotalFiresColor(value);
    }
}

function getLegendItems(currentFilter) {
    switch (currentFilter) {
        case "Efficiency Index":
            return [
                { label: "No data", color: missingDataColor },
                { label: "≥ 0.1", color: lowRiskColor },
                { label: "0.1 > x > 0.009", color: mediumRiskColor },
                { label: "≤ 0.009", color: highRiskColor }
            ];
        case "Prevention Index":
            return [
                { label: "No data", color: missingDataColor },
                { label: "≥ 0.5", color: lowRiskColor },
                { label: "0.5 > x > 0.09", color: mediumRiskColor },
                { label: "≤ 0.09", color: highRiskColor }
            ];
        case "Percentage Burned":
            return [
                { label: "No data", color: missingDataColor },
                { label: "≤ 1.99%", color: lowRiskColor },
                { label: "1.99% < x < 5%", color: mediumRiskColor },
                { label: "≥ 5", color: highRiskColor }
            ];
        default:
            return [
                { label: "No data", color: missingDataColor },
                { label: "≤ 199", color: lowRiskColor },
                { label: "199 < x < 500", color: mediumRiskColor },
                { label: "≥ 500", color: highRiskColor }
            ];
    }
}