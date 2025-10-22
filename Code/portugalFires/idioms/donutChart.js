/**
 * Creates a configurable donut chart.
 * @param {object} sharedState - The shared state object.
 * @param {string} containerId - The selector for the chart's container (e.g., ".CausesDonutChart").
 * @param {object} config - Configuration object for the chart.
 * @param {string} config.titlePrefix - The text to show before the region name (e.g., "Causes of Fires in ").
 * @param {function} config.dataFunction - The function to call to get the data (e.g., getCausesForRange).
 * @param {string[]} config.colors - The array of colors for the color scale (e.g., causeColors).
 * @param {string} config.inactiveSelector - The selector for the *other* chart to deactivate (e.g., ".DimensionsDonutChart").
 */
function createDonutChart(sharedState, containerId, config) {
    // ========================
    // Setup
    // ========================
    const data = sharedState.data;
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal");

    const years = data.map(d => d.year);

    const width = window.innerWidth * 0.25;
    const height = window.innerHeight * 0.23;
    const radius = Math.min(width, height) / 2;

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.9);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.numero);

    const colorScale = d3.scaleOrdinal(config.colors);

    // ========================
    // Wrapper for controls + chart
    // ========================
    const wrapper = d3.select(containerId)
        .append("div")
        .style("display", "flex")
        .style("flex-direction", "column")

    // ========================
    // Wrappers for title + controls + chart
    // ========================
    // Title (above everything)
    const titleWrapper = wrapper.append("div")
        .attr("class", "donut-title")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("gap", "4px")
        .style("margin-bottom", "4px"); 

    const titleText = titleWrapper.append("span")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Fire Characteristics in " + sharedState.region);

    // Create a horizontal layout for toggles + chart
    const chartArea = wrapper.append("div")
        .style("display", "flex")

    // Toggle controls (on the left)
    const toggleControls = chartArea.append("div")
        .attr("class", "toggle-controls")
        .style("display", "flex")

    // Chart + legend wrapper (on the right)
    const chartWrapper = chartArea.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("gap", "20px");

    // Toggle + labels row
    const toggleRow = toggleControls.append("div")
        .style("display", "flex")
        .style("align-items", "flex-start")
        .style("justify-content", "center")
        .style("flex-direction", "column")
        .style("gap", "4px");

    // Toggle group for Dimensions
    const dimensionsGroup = toggleRow.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "6px");

    dimensionsGroup.append("span")
        .attr("class", "chart-label")
        .style("font-weight", "bold")
        .style("display", "inline-block")
        .style("width", "100px") // ensures alignment
        .text("Dimensions");

    const dimensionsToggleWrapper = dimensionsGroup.append("label")
        .attr("class", "toggle-switch");

    const dimensionsToggleInput = dimensionsToggleWrapper.append("input")
        .attr("type", "checkbox")
        .on("change", switchChart);

    dimensionsToggleWrapper.append("span")
        .attr("class", "slider");

    // Toggle group for Causes
    const causesGroup = toggleRow.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "4px");

    causesGroup.append("span")
        .attr("class", "chart-label")
        .style("font-weight", "bold")
        .style("display", "inline-block")
        .style("width", "100px")
        .text("Causes");

    const causesToggleWrapper = causesGroup.append("label")
        .attr("class", "toggle-switch");

    const causesToggleInput = causesToggleWrapper.append("input")
        .attr("type", "checkbox")
        .on("change", switchChart);

    causesToggleWrapper.append("span")
        .attr("class", "slider");

    function switchChart() {
        const thisChart = d3.select(containerId);
        const otherChart = d3.select(config.inactiveSelector);

        // Flip active states
        thisChart.classed("active", !thisChart.classed("active"));
        otherChart.classed("active", !otherChart.classed("active"));
        
        updateChart(sharedState);
    }

    // ========================
    // Chart wrapper
    // ========================
    const svgBase = chartWrapper.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", width + "px")
        .style("height", height + "px");

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Tooltip
    const tooltip = d3.select(containerId)
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Legend
    const legend = chartWrapper.append("div")
        .attr("class", "legend")
        .style("margin-left", "20px");

    function updateLegend(chartData) {
        legend.html("");
        chartData.forEach(c => {
            const row = legend.append("div")
                .attr("class", "legend-row")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-bottom", "4px")
                .style("width", "200px")
                .style("cursor", "pointer")
                .on("mouseover", function () {
                    // Destaca a fatia correspondente
                    svg.selectAll("path")
                        .filter(d => d.data.label === c.label)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 1.5)
                        .raise(); // traz para a frente
                })
                .on("mouseout", function () {
                    // Remove destaque
                    svg.selectAll("path")
                        .filter(d => d.data.label === c.label)
                        .attr("stroke", "none");
                });

            row.append("div")
                .style("width", "14px")
                .style("height", "14px")
                .style("margin-right", "6px")
                .style("background-color", colorScale(c.label));

            row.append("span").text(c.label);
        });
    }

    // ========================
    // Update chart
    // ========================
    function updateChart(state = sharedState) {
        const chartData = config.dataFunction(state.region, state.getStartYearIndex(), state.getEndYearIndex(), data);
        const total = d3.sum(chartData, d => d.numero);

        // Visually update toggle
        if (config.inactiveSelector === ".CausesDonutChart") {
            dimensionsToggleInput.property("checked", true);
            causesToggleInput.property("checked", false);
        } else {
            dimensionsToggleInput.property("checked", false);
            causesToggleInput.property("checked", true);
        }

        titleText.text("Fire Characteristics in " + state.region);

        svg.selectAll(".no-data-text").remove();

        if (total === 0) {
            svg.selectAll("path").remove();
            updateLegend([]);
            svg.append("text")
                .attr("class", "no-data-text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .text("No data available for this region");
            return;
        }

        const arcs = pie(chartData);

        const paths = svg.selectAll("path")
            .data(arcs, d => d.data.label);

        paths.exit().remove();

        paths.enter()
            .append("path")
            .attr("fill", d => colorScale(d.data.label))
            .attr("d", arc)
            .each(function(d) { this._current = d; })
            .merge(paths)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
                tooltip.transition().duration(200).style("opacity", 1);
                const percentage = ((d.data.numero / total) * 100).toFixed(1);
                tooltip.html(`<strong>${d.data.label}</strong><br/>Fires: ${d.data.numero}<br/>(${percentage}%)`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", "none");
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attrTween("d", function(d) {
                const interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(1);
                return t => arc(interpolate(t));
            });

        updateLegend(chartData);
    }

    // ========================
    // Listen to sharedState updates
    // ========================
    sharedState.onChange(state => {
        updateChart(state);
    });

    // ========================
    // Initialize
    // ========================
    d3.select(containerId).classed("active", true);
    d3.select(config.inactiveSelector).classed("active", false);

    updateChart(sharedState);
}
