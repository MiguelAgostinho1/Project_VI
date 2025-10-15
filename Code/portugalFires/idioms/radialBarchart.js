function createRadialBarchart(sharedState, containerId) {
    const container = d3.select(containerId);

    // ========================
    // Setup
    // ========================
    const data = sharedState.data
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal");

    const width = window.innerWidth * 0.4;
    const height = window.innerHeight * 0.6;
    const minDim = Math.min(width, height);
    const innerR = minDim * 0.15;
    const outerR = minDim * 0.40;
    const barColor = "green";
    let previousRegion = sharedState.region;

    //let currentRegion = "Portugal";

    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Vertical wrapper
    const wrapper = container.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    // Controls wrapper (title + dropdown)
    const controls = wrapper.append("div")
        .attr("class", "controls")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("margin-bottom", "12px")
        .style("gap", "6px");

    // Title
    controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Fires per Year");

    // SVG wrapper
    const svgBase = wrapper.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet") 
        .style("width", "100%")
        .style("height", "60vh");

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2},${height / 2.3})`);

    // ========================
    // Helper function
    // ========================
    function polarToCartesian(angle, radius) {
        return {
            x: Math.cos(angle - Math.PI / 2) * radius,
            y: Math.sin(angle - Math.PI / 2) * radius
        };
    }

    // ========================
    // Update function
    // ========================
    function updateRadialBarChart(state) {
        svg.selectAll("*").remove();

        const totalsByYear = getTotals(state.region, state.data);
        const maxValue = d3.max(totalsByYear, d => d.total) || 0;

        if (maxValue === 0) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .text("No data available for this region");
            return;
        }

        const targetIntervals = 8;
        const step = d3.tickStep(0, maxValue, targetIntervals);
        const axisMax = Math.ceil(maxValue / step) * step;
        const ticks = d3.range(0, axisMax + step, step);

        const bandScale = d3.scaleBand()
            .domain(totalsByYear.map(d => d.year))
            .range([innerR, outerR])
            .padding(0.2);

        const angleScale = d3.scaleLinear()
            .domain([0, axisMax])
            .range([0, 3 * Math.PI / 2]);

        const barPadding = 12;

        const arc = d3.arc()
            .innerRadius(d => bandScale(d.year) - barPadding)
            .outerRadius(d => bandScale(d.year) + bandScale.bandwidth() - barPadding)
            .startAngle(0)
            .endAngle(d => angleScale(d.total));

        // Ticks
        ticks.forEach(t => {
            const angle = angleScale(t);
            const end = polarToCartesian(angle, outerR);

            svg.append("line")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", end.x).attr("y2", end.y)
                .attr("stroke", t === 0 || t === axisMax ? "#000" : "#999")
                .attr("stroke-dasharray", t === 0 || t === axisMax ? null : "3,3")
                .attr("stroke-width", 1);

            if (t !== 0) {
                svg.append("text")
                    .attr("x", end.x * 1.08)
                    .attr("y", end.y * 1.08)
                    .attr("text-anchor", "middle")
                    .attr("alignment-baseline", "middle")
                    .style("font-size", "10px")
                    .text(t);
            }
        });

        // Bars
        const bars = svg.selectAll("path")
            .data(totalsByYear, d => d.year);

        bars.exit().remove();

        bars.enter()
            .append("path")
            .attr("fill", barColor)
            .attr("d", d => arc({ ...d, total: 0 }))
            .merge(bars)
            .transition()
            .duration(800)
            .attrTween("d", function(d) {
                const i = d3.interpolate(0, d.total);
                return t => arc({ ...d, total: i(t) });
            });

        // Tooltip behavior
        svg.selectAll("path")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.year}</strong><br/>Total fires: ${d.total}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", barColor);
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .on("click", function(event, d) {
                if (state.yearIndex != state.data.findIndex(yr => yr.year === d.year)) {
                    sharedState.setYearIndex(state.data.findIndex(yr => yr.year === d.year));
                } else {
                    sharedState.setYearIndex(0);
                }
            });

        // Year labels
        svg.selectAll(".year-label")
            .data(totalsByYear)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", -10)
            .attr("y", d => -bandScale(d.year) - bandScale.bandwidth() / 2 + barPadding)
            .attr("text-anchor", "end")
            .style("alignment-baseline", "middle")
            .style("font-size", "10px")
            .text(d => d.year);
    }

    // ========================
    // Listen to sharedState updates
    // ========================
    sharedState.onChange(state => {
        if (state.region !== previousRegion) {
            updateRadialBarChart(state);
            previousRegion = state.region;
        }
    });


    // ========================
    // Initial Draw
    // ========================
    updateRadialBarChart(sharedState);
}
