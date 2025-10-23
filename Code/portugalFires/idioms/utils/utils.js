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
const dimensionColors = [
    "#ffdc32",
    "#ffcd5a",
    "#ffb93c",
    "#ffa528",
    "#ff911e",
    "#e94d00",
    "#cc2500",
    "#990000"
];

const causeColors = [
    "#ffd84d",
    "#5bc0de",
    "#8e5ad1",
    "#5cb85c",
    "#8b4513",
    "#999999"
];

// Define configurations
const causesConfig = {
    titlePrefix: "Causes of Fires in ",
    dataFunction: getCausesForRange,  // Pass the function itself
    colors: causeColors,
    inactiveSelector: ".DimensionsDonutChart"
};

const dimensionsConfig = {
    titlePrefix: "Dimensions of Fires in ",
    dataFunction: getDimensionsForRange, // Pass the function itself
    colors: dimensionColors,
    inactiveSelector: ".CausesDonutChart"
};

// Helper function to extract years from indices
function getYearsInRange(startYearIndex, endYearIndex, data) {
    const years = data.map(d => d.year);
    const startYear = years[startYearIndex];
    const endYear = years[endYearIndex];

    return data.filter(d => d.year >= startYear && d.year <= endYear);
}

function getCausesForRange(region, startYearIndex, endYearIndex, data) {
    // 1. Get all year objects in the selected range
    const yearsData = getYearsInRange(startYearIndex, endYearIndex, data);
    if (yearsData.length === 0) return [];

    const causeMap = new Map();

    // 2. Iterate and aggregate across ALL years in the range
    yearsData.forEach(yearData => {
        if (region === "Portugal") {
            // Aggregation across regions AND years
            yearData.regions.forEach(r => {
                (r.causas || []).forEach(c => {
                    const prev = causeMap.get(c.label) || 0;
                    causeMap.set(c.label, prev + (c.numero || 0));
                });
            });
        } else {
            // Aggregation across only years for a specific region
            const regionData = yearData.regions.find(r => r.region === region);
            if (regionData) {
                (regionData.causas || []).forEach(c => {
                    const prev = causeMap.get(c.label) || 0;
                    causeMap.set(c.label, prev + (c.numero || 0));
                });
            }
        }
    });

    // 3. Convert the map back to the desired array format
    return Array.from(causeMap, ([label, numero]) => ({ label, numero }));
}

function getDimensionsForRange(region, startYearIndex, endYearIndex, data) {
    // 1. Get all year objects in the selected range
    const yearsData = getYearsInRange(startYearIndex, endYearIndex, data);
    if (yearsData.length === 0) return [];

    const dimensionMap = new Map();

    // 2. Iterate and aggregate across ALL years in the range
    yearsData.forEach(yearData => {
        if (region === "Portugal") {
            // Aggregation across regions AND years
            yearData.regions.forEach(r => {
                (r.dimensoes || []).forEach(d => {
                    const prev = dimensionMap.get(d.label) || 0;
                    dimensionMap.set(d.label, prev + (d.numero || 0));
                });
            });
        } else {
            // Aggregation across only years for a specific region
            const regionData = yearData.regions.find(r => r.region === region);
            if (regionData) {
                (regionData.dimensoes || []).forEach(d => {
                    const prev = dimensionMap.get(d.label) || 0;
                    dimensionMap.set(d.label, prev + (d.numero || 0));
                });
            }
        }
    });

    // 3. Convert the map back to the desired array format
    return Array.from(dimensionMap, ([label, numero]) => ({ label, numero }));
}

// ================================================
// Choropleth map helper functions and variables
// ================================================
const missingDataColor = "#ccc";
const lowRiskColor = "#1a987dff";
const mediumRiskColor = "#ffa528";
const highRiskColor = "#990000";

/**
 * Calculates the color for the Efficiency Index (Average).
 * Thresholds: >= 0.1 (Low), 0.1 > x > 0.009 (Medium), <= 0.009 (High).
 * The rangeLength is unused as the average remains on the same scale.
 * * @param {number} value - The calculated average Efficiency Index.
 * @returns {string} The corresponding color code.
 */
function getRangeEfficiencyColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    
    // Low Risk: value >= 0.1
    if (value >= 0.1) return lowRiskColor;
    
    // High Risk: value <= 0.009
    if (value <= 0.009) return highRiskColor;
    
    // Medium Risk: 0.009 < value < 0.1
    return mediumRiskColor;
}

/**
 * Calculates the color for the Prevention Index (Average).
 * NOTE: Aligned with the thresholds previously defined in the legend: 
 * >= 0.5 (Low), 0.5 > x > 0.09 (Medium), <= 0.09 (High).
 * The rangeLength is unused as the average remains on the same scale.
 * * @param {number} value - The calculated average Prevention Index.
 * @returns {string} The corresponding color code.
 */
function getRangePreventionColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;

    // Low Risk: value >= 0.5
    if (value >= 0.5) return lowRiskColor;
    
    // High Risk: value <= 0.09
    if (value <= 0.09) return highRiskColor;
    
    // Medium Risk: 0.09 < value < 0.5
    return mediumRiskColor;
}

/**
 * Calculates the color for the Percentage Burned (Average).
 * NOTE: Aligned with the thresholds previously defined in the legend: 
 * <= 1.99% (Low), 1.99% < x < 5% (Medium), >= 5% (High).
 * The rangeLength is unused as the average remains on the same scale.
 * * @param {number} value - The calculated average Percentage Burned (0 to 100).
 * @returns {string} The corresponding color code.
 */
function getRangePercentageColor(value) {
    if (value === null || value === undefined || value === 0) return missingDataColor;
    
    // High Risk: value >= 5.0
    if (value >= 5.0) return highRiskColor;
    
    // Low Risk: value <= 1.99
    if (value <= 1.99) return lowRiskColor;
    
    // Medium Risk: 1.99 < value < 5.0
    return mediumRiskColor;
}

/**
 * Calculates the color for the Total Fires (Sum).
 * Thresholds are dynamically scaled by the number of years selected (rangeLength) 
 * to ensure the map colors are visually representative and comparable within the 
 * current time window.
 * * @param {number} value - The calculated total number of fires (sum).
 * @param {number} rangeLength - The number of years in the selected time range.
 * @returns {string} The corresponding color code.
 */
function getRangeTotalFiresColor(value, rangeLength) {
    if (value === null || value === undefined || value === 0) return missingDataColor;

    // Default to a range factor of 1 if not provided (for single-year calculation fallback)
    const factor = rangeLength || 1;

    // Dynamic thresholds based on single-year (199 and 500) scaled by the range length
    const lowToMediumThreshold = 199 * factor;
    const mediumToHighThreshold = 500 * factor;
    
    // High Risk: value > mediumToHighThreshold
    if (value > mediumToHighThreshold) return highRiskColor;
    
    // Low Risk: value <= lowToMediumThreshold
    if (value <= lowToMediumThreshold) return lowRiskColor;

    // Medium Risk: lowToMediumThreshold < value <= mediumToHighThreshold
    return mediumRiskColor;
}

function getColor(value, currentFilter, rangeLength) {
    // Ensure rangeLength is at least 1 if not defined, to prevent zero multiplication
    const length = rangeLength && rangeLength > 0 ? rangeLength : 1; 
    
    switch (currentFilter) {
        case "Efficiency Index":
            return getRangeEfficiencyColor(value);
        case "Percentage Burned":
            return getRangePercentageColor(value);
        case "Prevention Index":
            return getRangePreventionColor(value);
        default:
            return getRangeTotalFiresColor(value, length);
    }
}

function getLegendItems(currentFilter, rangeLength) {
    const length = rangeLength && rangeLength > 0 ? rangeLength : 1;
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
                { label: "≥ 5%", color: highRiskColor }
            ];
        default:
            return [
                { label: "No data", color: missingDataColor },
                { label: `≤ ${199 * length}`, color: lowRiskColor },
                { label: `${199 * length} < x < ${500 * length}`, color: mediumRiskColor },
                { label: `≥ ${500 * length}`, color: highRiskColor }
            ];
    }
}

/**
 * Retrieves and aggregates data for all regions across a specified time range.
 * Calculates the sum for "Total Fires" and the average for all indices/percentages.
 * * @param {number} startYear - The starting year of the range (inclusive).
 * @param {number} endYear - The ending year of the range (inclusive).
 * @param {Array<Object>} data - The full dataset, structured by year.
 * @param {string} currentFilter - The currently selected metric (e.g., "Total Fires").
 * @returns {Array<{region: string, total: number}>} An array of region data with the aggregated value.
 */
function getData(startYearIndex, endYearIndex, data, currentFilter) {
    const years = data.map(d => d.year);
    const startYear = years[startYearIndex];
    const endYear = years[endYearIndex];
    const rangeLength = endYear - startYear + 1;

    // 1. Filter data for the selected range
    const relevantData = data.filter(d => d.year >= startYear && d.year <= endYear);

    if (relevantData.length === 0) return [];

    // 2. Determine the key to extract from the region objects
    let dataKey;
    switch (currentFilter) {
        case "Prevention Index":
            dataKey = 'prevencaoIndex';
            break;
        case "Efficiency Index":
            dataKey = 'eficaciaIndex';
            break;
        case "Percentage Burned":
            dataKey = 'percentagem';
            break;
        default:
            dataKey = 'total'; // Total Fires
            break;
    }

    // 3. Aggregate the sums across all regions and years
    // Map stores the sum of values for each region
    const aggregatedData = {};

    relevantData.forEach(yearData => {
        yearData.regions.forEach(regionData => {
            const regionName = regionData.region;
            const value = regionData[dataKey] || 0;

            if (!aggregatedData[regionName]) {
                aggregatedData[regionName] = 0;
            }
            aggregatedData[regionName] += value;
        });
    });

    // 4. Calculate the final value (sum or average) and format the output
    const finalData = Object.keys(aggregatedData).map(region => {
        let finalValue = aggregatedData[region];

        // For Averages (Indices and Percentage Burned), divide the sum by the number of years
        if (currentFilter !== "Total Fires" && rangeLength > 0) {
            finalValue /= rangeLength;
        }

        // Return the region name and the aggregated metric value
        return {
            region: region,
            total: finalValue
        };
    });

    return finalData;
}