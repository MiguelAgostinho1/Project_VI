// =================================================
// Radial Bar chart helper functions and variables
// =================================================
const polarToCartesian = (angle, r) => ({
    x: Math.cos(angle - Math.PI / 2) * r,
    y: Math.sin(angle - Math.PI / 2) * r
});

function getTotals(region, data) {
    return data.map(d => {
        if (region === "Portugal") {
            const total = d.regions.reduce((sum, r) => sum + (r.total || 0), 0);
            return { year: d.year, total };
        }
        const regionData = d.regions.find(r => r.region === region);
        return { year: d.year, total: regionData ? (regionData.total || 0) : 0 };
    });
}

// ============================================
// Donut chart helper functions and variables
// ============================================
// Title
const title = d3.select("#donutChartTitle");
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

function getCauses(region, year, data) {
    const yearData = data.find(d => d.year === year);
    if (!yearData) return [];

    if (region === "Portugal") {
        const causeMap = new Map();
        yearData.regions.forEach(r => {
            (r.causas || []).forEach(c => {
                const prev = causeMap.get(c.causa) || 0;
                causeMap.set(c.causa, prev + (c.numero || 0));
            });
        });
        return Array.from(causeMap, ([causa, numero]) => ({ causa, numero }));
    } else {
        const regionData = yearData.regions.find(r => r.region === region);
        return regionData ? regionData.causas || [] : [];
    }
}

function getDimensions(region, year, data) {
    const yearData = data.find(d => d.year === year);
    if (!yearData) return [];

    if (region === "Portugal") {
        const dimensionMap = new Map();
        yearData.regions.forEach(r => {
            (r.dimensoes || []).forEach(c => {
                const prev = dimensionMap.get(c.label) || 0;
                dimensionMap.set(c.label, prev + (c.numero || 0));
            });
        });
        return Array.from(dimensionMap, ([label, numero]) => ({ label, numero }));
    } else {
        const regionData = yearData.regions.find(r => r.region === region);
        return regionData ? regionData.dimensoes || [] : [];
    }
}

// ================================================
// Choropleth map helper functions and variables
// ================================================
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

function getData(year, data, currentFilter) {
    const yearData = data.find(d => d.year === year);
    if (!yearData) return [];
    switch (currentFilter) {
        case "Prevention Index":
            return yearData.regions.map(r => ({
                region: r.region,
                total: r.prevencaoIndex || 0
            }));
        case "Efficiency Index":
            return yearData.regions.map(r => ({
                region: r.region,
                total: r.eficaciaIndex || 0
            }));
        case "Percentage Burned":
            return yearData.regions.map(r => ({
                region: r.region,
                total: r.percentagem || 0
            }));
        default:
            return yearData.regions.map(r => ({
                region: r.region,
                total: r.total || 0
            })); // default to total number of fires
    }
}