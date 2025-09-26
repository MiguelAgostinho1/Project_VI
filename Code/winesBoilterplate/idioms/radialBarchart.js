function createRadialBarchart(data, containerId) {
    // Extract unique regions
    const regions = Array.from(new Set(
        data.flatMap(d => d.regions.map(r => r.region))
    ));

    // Add "Portugal" as an overall category
    regions.unshift("Portugal");

    // SVG setup
    const width = 600, height = 600;

    // --- Controls Row (title + dropdown) ---
    const controls = d3.select(containerId)
        .append("div")
        .style("display", "flex")
        .style("justify-content", "space-between")
        .style("align-items", "center")
        .style("margin-bottom", "8px");

    // Title
    controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Fires per Year");

    // Dropdown
    const select = controls.append("select")
        .on("change", function() {
            const region = this.value;
            updateChart(region);
        });

    select.selectAll("option")
        .data(regions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // --- SVG container ---
    const svgBase = d3.select(containerId)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Initial chart
    updateChart("Portugal");

    // ========================
    // Update function
    // ========================
    function updateChart(region) {
        // Clear previous contents (but keep the g container)
        svg.selectAll("*").remove();

        const totalsByYear = getTotals(region);

        // Scales
        let maxValue = d3.max(totalsByYear, d => d.total) || 0;

        // Handle "no data" case
        if (maxValue === 0) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .text("No data available for this region");
            return; // stop here, don't try to draw axes/arcs
        }
        
        // Normal case
        const targetIntervals = 8;
        const step = d3.tickStep(0, maxValue, targetIntervals);
        const axisMax = Math.ceil(maxValue / step) * step;
        const ticks = d3.range(0, axisMax + step, step);


        const innerR = 70, outerR = 270;

        const bandScale = d3.scaleBand()
            .domain(totalsByYear.map(d => d.year))
            .range([80, 250])
            .padding(0.2);

        const angleScale = d3.scaleLinear()
            .domain([0, axisMax])
            .range([0, 3 * Math.PI / 2]);

        function polarToCartesian(angle, r) {
            return {
                x: Math.cos(angle - Math.PI / 2) * r,
                y: Math.sin(angle - Math.PI / 2) * r
            };
        }

        function formatTick(t) {
            if (t >= 1000) {
                return (t % 1000 === 0) 
                    ? `${t/1000}k`
                    : `${(t/1000).toFixed(1)}k`;
            } else {
                return t.toString();
            }
        }

        // Draw tick guide lines + labels
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
                    .text(formatTick(t));
            }
        });

        // Arc generator
        const arc = d3.arc()
            .innerRadius(d => bandScale(d.year))
            .outerRadius(d => bandScale(d.year) + bandScale.bandwidth())
            .startAngle(0)
            .endAngle(d => angleScale(d.total));

        // Draw arcs
        svg.selectAll("path")
            .data(totalsByYear)
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", "green")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "green");
            })
            .on("click", function (event, d) {
                Swal.fire({
                    title: `Fires in ${d.year}`,
                    text: `Total fires: ${d.total}`,
                    icon: 'info',
                    confirmButtonText: 'Close'
                });
            });

        // Year labels
        svg.selectAll(".year-label")
            .data(totalsByYear)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", -10)
            .attr("y", d => -bandScale(d.year) - bandScale.bandwidth() / 2)
            .attr("text-anchor", "end")
            .style("alignment-baseline", "middle")
            .style("font-size", "12px")
            .text(d => d.year);
    }

    // ========================
    // Totals helper
    // ========================
    function getTotals(region) {
        if (region === "Portugal") {
            return data.map(d => ({
                year: d.year,
                total: d.regions.reduce((sum, r) => sum + (r.total || 0), 0)
            }));
        } else {
            return data.map(d => {
                const regionData = d.regions.find(r => r.region === region);
                return {
                    year: d.year,
                    total: regionData ? regionData.total : 0
                };
            });
        }
    }
}
