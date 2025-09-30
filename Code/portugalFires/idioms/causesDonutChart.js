function createCausesDonutChart(data, containerId, overall) {
    // ========================
    // Helper functions
    // ========================
    function getCauses(region, year) {
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

    // ========================
    // Setup
    // ========================
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal");

    const years = data.map(d => d.year);
    let currentYearIndex = 0;
    let currentRegion = "Portugal";

    const width = window.innerWidth * 0.25;
    const height = window.innerHeight * 0.4;
    const radius = Math.min(width, height) / 2;

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.9);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.numero);

    const colorScale = d3.scaleOrdinal(causeColors);

    // Controls
    const controls = d3.select(containerId)
        .append("div")
        .attr("class", "controls");

    controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Causes of Fires");

    // Dropdown
    const select = controls.append("select")
        .on("change", function () {
            currentRegion = this.value;
            updateChart();
        });

    select.selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Year controls
    const yearControls = controls.append("div").style("margin", "8px 0");

    yearControls.append("button")
        .text("⟨")
        .on("click", () => {
            if (currentYearIndex > 0) {
                currentYearIndex--;
                updateChart();
            }
        });

    const yearLabel = yearControls.append("span")
        .style("margin", "0 10px")
        .style("font-weight", "bold")
        .text(years[currentYearIndex]);

    yearControls.append("button")
        .text("⟩")
        .on("click", () => {
            if (currentYearIndex < years.length - 1) {
                currentYearIndex++;
                updateChart();
            }
        });

    // --- Container for donut + legend ---
    const chartWrapper = d3.select(containerId)
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")   // vertical centering
        .style("justify-content", "center"); // horizontal centering

    // SVG
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

    // Legend (placed to the right of donut)
    const legend = chartWrapper.append("div")
        .attr("class", "legend")
        .style("margin-left", "20px"); // spacing from donut

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
    // Update function
    // ========================
    function updateChart() {
        const year = years[currentYearIndex];
        const causes = getCauses(currentRegion, year);
        const total = d3.sum(causes, d => d.numero);

        yearLabel.text(year);

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

    // Draw initial chart
    updateChart();
}
