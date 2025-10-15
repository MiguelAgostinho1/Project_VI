function createCausesDonutChart(sharedState, containerId) {
    // ========================
    // Setup
    // ========================
    const data = sharedState.data; // Optional if you store it inside sharedState
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

    const colorScale = d3.scaleOrdinal(causeColors);

    // ========================
    // Wrapper for controls + chart
    // ========================
    const wrapper = d3.select(containerId)
        .append("div")
        .style("display", "flex")
        .style("flex-direction", "column") // stack vertically
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("padding-top", "1vh"); // relative to viewport height

    // ========================
    // Controls wrapper
    // ========================
    const controls = wrapper.append("div")
        .attr("class", "controls")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")

    // Title with arrows
    const titleWrapper = controls.append("div")
        .attr("class", "donut-title")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .style("gap", "4px")
        .style("font-size", "18px")
        .style("font-weight", "bold")

    titleWrapper.append("span")
        .style("cursor", "pointer")
        .text("⟨")
        .on("click", () => switchChart(-1));

    const titleText = titleWrapper.append("span")
        .text("Causes of Fires in " + sharedState.region);

    titleWrapper.append("span")
        .style("cursor", "pointer")
        .text("⟩")
        .on("click", () => switchChart(1));

    // ========================
    // Chart wrapper
    // ========================
    const chartWrapper = wrapper.append("div")
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")

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

    function updateLegend(causes) {
        legend.html("");
        causes.forEach(c => {
            const row = legend.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-bottom", "4px");

            row.append("div")
                .style("width", "14px")
                .style("height", "14px")
                .style("margin-right", "6px")
                .style("background-color", colorScale(c.causa));

            row.append("span").text(c.causa);
        });
    }

    // ========================
    // Update chart
    // ========================
    function updateCausesChart(state = sharedState) {
        const year = years[state.getStartYearIndex()];
        const causes = getCausesForRange(state.region, state.getStartYearIndex(), state.getEndYearIndex(), data);
        const total = d3.sum(causes, d => d.numero);

        titleText.text("Causes of Fires in " + state.region);

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

        const arcs = pie(causes);

        const paths = svg.selectAll("path")
            .data(arcs, d => d.data.causa);

        paths.exit().remove();

        paths.enter()
            .append("path")
            .attr("fill", d => colorScale(d.data.causa))
            .attr("d", arc)
            .each(function(d) { this._current = d; })
            .merge(paths)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
                tooltip.transition().duration(200).style("opacity", 1);
                const percentage = ((d.data.numero / total) * 100).toFixed(1);
                tooltip.html(`<strong>${d.data.causa}</strong><br/>Fires: ${d.data.numero}<br/>(${percentage}%)`)
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

        updateLegend(causes);
    }

    // ========================
    // Listen to sharedState updates
    // ========================
    sharedState.onChange(state => {
        updateCausesChart(state);
    });

    // ========================
    // Initialize
    // ========================
    d3.select(".CausesDonutChart").classed("active", true);
    d3.select(".DimensionsDonutChart").classed("active", false);

    updateCausesChart(sharedState);
}
