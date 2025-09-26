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
                const total = d.regions.reduce((sum, r) => sum + (r.total || 0), 0);
                return { year: d.year, total };
            }
            const regionData = d.regions.find(r => r.region === region);
            return { year: d.year, total: regionData ? regionData.total : 0 };
        });
    }

    // ========================
    // Setup
    // ========================
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal"); // add overall

    const width = window.innerWidth * 0.45;
    const height = window.innerHeight * 0.6;
    const minDim = Math.min(width, height);  // whichever is smaller
    const innerR = minDim * 0.15;            // 15% of container
    const outerR = minDim * 0.40;            // 40% of container

    // Controls row
    const controls = d3.select(containerId)
        .append("div")
        .attr("class", "controls")

    controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Fires per Year");

    const select = controls.append("select")
        .on("change", function () {
            updateChart(this.value);
        });

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
      .style("width", "100%")
      .style("height", "auto");

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2},${height / 2.3})`);

    // ========================
    // Update function
    // ========================
    function updateChart(region) {
        svg.selectAll("*").remove(); // clear

        const totalsByYear = getTotals(region);
        const maxValue = d3.max(totalsByYear, d => d.total) || 0;

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

        // --- Arcs ---
        svg.selectAll("path")
            .data(totalsByYear)
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", "green")
            .on("mouseover", function () {
                d3.select(this).attr("fill", "orange");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "green");
            })
            .on("click", (event, d) => {
                Swal.fire({
                    title: `Fires in ${d.year}`,
                    text: `Total fires: ${d.total}`,
                    icon: "info",
                    confirmButtonText: "Close"
                });
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
