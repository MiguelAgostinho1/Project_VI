function createRadialBarchart(data, containerId) {
    // ========================
    // Helper functions
    // ========================
    // Convert polar coordinates to cartesian
    const polarToCartesian = (angle, r) => ({
        x: Math.cos(angle - Math.PI / 2) * r,
        y: Math.sin(angle - Math.PI / 2) * r
    });

    // Get total fires per year for a given region (or overall if region is "Portugal")
    function getTotals(region) {
        return data.map(d => {
            if (region === "Portugal") {
                const total = d.regions.reduce((sum, r) => sum + (r.total || 0), 0); // (r.total || 0) r.total or 0 if undefined
                return { year: d.year, total };
            }
            const regionData = d.regions.find(r => r.region === region);
            return { year: d.year, total: regionData ? (regionData.total || 0) : 0}; // if region doesnt exist then total=0, if exists and doens have total then total=0
        });
    }

    // ========================
    // Setup
    // ========================
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal"); // add Portugal option to the begining array

    const width = window.innerWidth * 0.45;
    const height = window.innerHeight * 0.6;
    const minDim = Math.min(width, height);  // whichever is smaller
    const innerR = minDim * 0.15;            // 15% of container
    const outerR = minDim * 0.40;            // 40% of container
    const barColor = "green"

    // Criar tooltip (uma div escondida ao início)
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

    // Controls row
    const controls = d3.select(containerId)
        .append("div")
        .attr("class", "controls")

    // title
    controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Fires per Year");

    // dropdown
    const select = controls.append("select")
        .on("change", function () {
            updateChart(this.value);
        });

    //dropdown data
    select.selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // SVG container
    const svgBase = d3.select(containerId)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet") 
      .style("width", "auto")
      .style("height", "auto");

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2},${height / 2.3})`); // draw on the center of the rbc

    // ========================
    // Update function
    // ========================
    function updateChart(region) { //region string
        svg.selectAll("*").remove(); // clear

        const totalsByYear = getTotals(region);
        const maxValue = d3.max(getTotals(region), d => d.total) || 0;

        if (maxValue === 0) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .text("No data available for this region");
            return;
        }

        // --- Scales ---
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

        const barPadding = 12; // pixels to push bars outward

        const arc = d3.arc()
          .innerRadius(d => bandScale(d.year) - barPadding)
          .outerRadius(d => bandScale(d.year) + bandScale.bandwidth() - barPadding)
          .startAngle(0)
          .endAngle(d => angleScale(d.total));


        // --- Tick guide lines + labels ---
        ticks.forEach(t => {
            const angle = angleScale(t);
            const end = polarToCartesian(angle, outerR);

            svg.append("line")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", end.x).attr("y2", end.y)
                .attr("stroke", t === 0 || t === axisMax ? "#000" : "#999")
                .attr("stroke-dasharray", t === 0 || t === axisMax ? null : "3,3") // dash size
                .attr("stroke-width", 1);
            
            // ticks values writing
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

        // --- Bars with animation ---
        const bars = svg.selectAll("path")
            .data(totalsByYear, d => d.year); // key by year so D3 can match old/new data
         
        // Exit old arcs
        bars.exit().remove();

        // Update + Enter
        bars.enter()
            .append("path")
            .attr("fill", barColor)
            .attr("d", d => arc({ ...d, total: 0 })) // start from 0
            .merge(bars) // merge with update selection
            .transition()
            .duration(800)
            .attrTween("d", function(d) {
                const i = d3.interpolate(0, d.total); // interpolate values
                return t => arc({ ...d, total: i(t) });
            });

        // Tooltip interactivity
        svg.selectAll("path")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");

                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.year}</strong><br/>Total fires: ${d.total}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
                // atualizar posição do tooltip conforme o rato se mexe
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", barColor);

                tooltip.transition().duration(200).style("opacity", 0);
            });

        // --- Year labels ---
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

    // Draw initial chart
    updateChart("Portugal");
}
