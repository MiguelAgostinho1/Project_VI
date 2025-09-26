function createRadialBarchart(data, containerId) {
    const totalsByYear = data.map(d => ({
        year: d.year,
        total: d.regions.reduce((sum, r) => sum + (r.total || 0), 0)
    }));

    // SVG setup
    const width = 600, height = 600;
    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Fires per Year");

    // Scales
    const maxValue = d3.max(totalsByYear, d => d.total);
    // Desired number of intervals (not ticks, just a target)
    const targetIntervals = 8;
    // Find a "nice" step size automatically
    const step = d3.tickStep(0, maxValue, targetIntervals);
    // Round axisMax up to the nearest multiple of step
    const axisMax = Math.ceil(maxValue / step) * step;
    // Generate ticks at that step size
    const ticks = d3.range(0, axisMax + step, step);

    // Add radial axis ticks (like 5k, 10k, etc.)
    const innerR = 70, outerR = 270;
    const originAngle = 0;
    const endAngle = 3 * Math.PI / 2; 
    
    // Radius bands → one band per year
    const bandScale = d3.scaleBand()
        .domain(totalsByYear.map(d => d.year))
        .range([80, 250])   // inner to outer radius
        .padding(0.2);

    const angleScale = d3.scaleLinear()
        .domain([0, axisMax])
        .range([0, 3 * Math.PI / 2]); // value → angle (max 270 degrees)

    // Function to convert polar to cartesian coordinates
    function polarToCartesian(angle, r) {
        return {
            x: Math.cos(angle - Math.PI / 2) * r,
            y: Math.sin(angle - Math.PI / 2) * r
        };
    }

    ticks.forEach(t => {
        const angle = angleScale(t);           // angle for this tick value
        const end = polarToCartesian(angle, outerR); // end of the guide line

        // dashed guide line from center to outer radius
        if (t == 0 || t == axisMax) {
            svg.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", end.x).attr("y2", end.y)
            .attr("stroke", "#000")
            .attr("stroke-width", 1);
        } else {
            svg.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", end.x).attr("y2", end.y)
            .attr("stroke", "#999")
            .attr("stroke-dasharray", "3,3")
            .attr("stroke-width", 1);
        }

        // label at the end of the guide
        if (t != 0) {
            svg.append("text")
                .attr("x", end.x * 1.08)   // push label slightly beyond line
                .attr("y", end.y * 1.08)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "10px")
                .text(`${t/1000}k`);
        }
    })

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

    // Add year labels on the left side
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
