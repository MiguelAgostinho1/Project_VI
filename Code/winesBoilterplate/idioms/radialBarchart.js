function createRadialBarchart(data, containerId) {
    const structured = Object.entries(data).map(([year, regions]) => ({
        year,
        regions: Object.entries(regions).map(([regionName, regionData]) => new RegionData(
            regionName,
            regionData.Area,
            regionData.Percentagem,
            regionData.Sapadores,
            regionData.Eficacia_Index,
            regionData["Prevenção_Index"],
            regionData.Total,
            regionData.Causas,
            regionData.Dimensões
        ))
    }));

    const totalsByYear = structured.map(d => ({
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

    // radius bands → one band per year
    const bandScale = d3.scaleBand()
        .domain(totalsByYear.map(d => d.year))
        .range([80, 250])   // inner to outer radius
        .padding(0.2);

    const angleScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, 3 * Math.PI / 2]); // value → angle (max 270 degrees)

    // Arc generator
    const arc = d3.arc()
        .innerRadius(d => bandScale(d.year))
        .outerRadius(d => bandScale(d.year) + bandScale.bandwidth())
        .startAngle(0)
        .endAngle(d => angleScale(d.total));

  // After drawing arcs, add axis lines
  const originAngle = 0;                // 0 degrees (12 o’clock)
  const endAngle = 3 * Math.PI / 2;     // 270 degrees

  // Helper to convert angle + radius → x,y
  function polarToCartesian(angle, r) {
      return [
          Math.cos(angle - Math.PI / 2) * r,  // subtract π/2 so 0° is at top
          Math.sin(angle - Math.PI / 2) * r
      ];
  }

  // Axis line for origin
  svg.append("line")
      .attr("x1", ...polarToCartesian(originAngle, 70))   // just inside inner radius
      .attr("y1", polarToCartesian(originAngle, 70)[1])
      .attr("x2", ...polarToCartesian(originAngle, 270))  // a bit beyond outer radius
      .attr("y2", polarToCartesian(originAngle, 270)[1])
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);

  // Axis line for end (270°)
  svg.append("line")
      .attr("x1", ...polarToCartesian(endAngle, 70))
      .attr("y1", polarToCartesian(endAngle, 70)[1])
      .attr("x2", ...polarToCartesian(endAngle, 270))
      .attr("y2", polarToCartesian(endAngle, 270)[1])
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);


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

    // Add radial axis ticks (like 5k, 10k, etc.)
    const ticks = [5000, 10000, 15000, 20000, 25000, 30000];
    svg.selectAll(".tick-circle")
        .data(ticks)
        .enter()
        .append("circle")
        .attr("class", "tick-circle")
        .attr("r", d => (angleScale(d) / (2 * Math.PI)) * 250) // convert angle to radius length
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

    svg.selectAll(".tick-label")
        .data(ticks)
        .enter()
        .append("text")
        .attr("class", "tick-label")
        .attr("x", d => Math.cos(angleScale(d) - Math.PI / 2) * 260)
        .attr("y", d => Math.sin(angleScale(d) - Math.PI / 2) * 260)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => `${d / 1000}k`);
}
