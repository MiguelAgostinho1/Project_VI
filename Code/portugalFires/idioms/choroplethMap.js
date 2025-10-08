function createChoroplethMap(data, containerId) {
    const container = d3.select(containerId);

    // ========================
    // Helper functions
    // ========================
    function getPreventionIndex(year) {
        const yearData = data.find(d => d.year === year);
        if (!yearData) return [];
        return yearData.regions.map(r => ({
            region: r.region,
            prevencaoIndex: r.prevencaoIndex || 0
        }));
    }

    function getColor(value) {
        if (value === null || value === undefined || value === 0) return "#ccc"; // gray
        if (value <= 0.009) return "#d73027"; // red
        if (value < 0.1) return "#fee08b"; // yellow
        return "#1a9850"; // teal/green
    }

    // ========================
    // Setup
    // ========================
    const years = data.map(d => d.year);
    const width = window.innerWidth * 0.45;
    const height = window.innerHeight * 0.6;
    let currentYearIndex = 0;
    let updateMap;

    // Tooltip
    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // --- vertical wrapper ---
    const wrapper = container.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    // --- Controls wrapper (title + dropdown) ---
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
        .text("Prevention Index by Region");

    // Year Controls
    const yearControls = controls.append("div")
    .style("margin", "8px 0")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px");

    // Previous year button
    yearControls.append("button")
        .text("⟨")
        .style("padding", "4px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "4px")
        .style("background", "#f8f8f8")
        .style("cursor", "pointer")
        .on("click", () => {
            if (currentYearIndex > 0) {
                currentYearIndex--;
                const year = years[currentYearIndex];
                yearLabel.text(year);
                updateMap(year);
            }
        });

    // Year label (bold text between arrows)
    const yearLabel = yearControls.append("span")
        .style("font-weight", "bold")
        .style("font-size", "16px")
        .text(years[currentYearIndex]);

    // Next year button
    yearControls.append("button")
        .text("⟩")
        .style("padding", "4px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "4px")
        .style("background", "#f8f8f8")
        .style("cursor", "pointer")
        .on("click", () => {
            if (currentYearIndex < years.length - 1) {
                currentYearIndex++;
                const year = years[currentYearIndex];
                yearLabel.text(year);
                updateMap(year);
            }
        });

    // --- SVG wrapper ---
    const svgBase = wrapper.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "60vh");

    const svg = svgBase.append("g");

    // ========================
    // Map setup & update
    // ========================
    d3.json("../data/portugal_nuts3_2024.geojson").then(function (geoData) {
        const projection = d3.geoMercator().fitSize([width, height], geoData);
        const path = d3.geoPath().projection(projection);

        // Base map outline
        svg.selectAll("path.base")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("class", "base")
            .attr("d", path)
            .attr("stroke", "#999")
            .attr("stroke-width", 0.5)
            .attr("fill", "#eee");

        // Color scale (fixed domain for consistent color range)
        const allValues = data.flatMap(d => d.regions.map(r => r.prevencaoIndex));

        // --- Update function ---
        updateMap = function (year) {
            const mapData = getPreventionIndex(year);
            const regionMap = new Map(mapData.map(d => [d.region, d.prevencaoIndex]));

            const paths = svg.selectAll("path.region")
                .data(geoData.features, d => d.properties.NUTS_ID);

            // Enter + update
            paths.enter()
                .append("path")
                .attr("class", "region")
                .attr("d", path)
                .attr("stroke", "#333")
                .attr("stroke-width", 0.6)
                .attr("fill", d => {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    return val !== undefined ? getColor(val) : "#ccc";
                })
                .on("mouseover", function (event, d) {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    d3.select(this).attr("stroke-width", 1.2).attr("stroke", "#000");
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`<strong>${d.properties.NAME_LATN}</strong><br/>Prevention Index: ${val ?? "N/A"}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", function (event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke-width", 0.6).attr("stroke", "#333");
                    tooltip.transition().duration(200).style("opacity", 0);
                })
                .merge(paths)
                .transition()
                .duration(800)
                .attr("fill", d => {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    return val !== undefined ? getColor(val) : "#ccc";
                });
        }

        // Initialize with the latest year
        updateMap(years[currentYearIndex]);
    });
}