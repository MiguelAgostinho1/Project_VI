function createChoroplethMap(sharedState, containerId) {
    // ========================
    // Constants & state
    // ========================
    const data = sharedState.data;

    const container = d3.select(containerId);
    const years = data.map(d => d.year);
    const width = window.innerWidth * 0.45;
    const height = window.innerHeight * 0.6;
    const format3 = d3.format(".3f");
    let updateMap;
    let regionMap;
    let legendItems;
    const filters = ["Total Fires", "Prevention Index", "Efficiency Index", "Percentage Burned"];
    let currentFilter = filters[0]; // default filter (Total Fires)
    sharedState.currentFilter = currentFilter;


    // ========================
    // Setup
    // ========================
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
        .style("gap", "6px");


    // Title
    const title = controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`${currentFilter} by Region`);
    
    // ========================
    // Filter buttons
    // ========================
    const filterControls = controls.append("div")
        .attr("class", "filter-buttons")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("justify-content", "center")
        .style("gap", "8px");
    
    // Create buttons for each filter
    filterControls.selectAll("button.filter")
        .data(filters)
        .enter()
        .append("button")
        .attr("class", "filter")
        .text(d => d)
        .style("padding", "6px 10px")
        .style("border", "1px solid #aaa")
        .style("border-radius", "6px")
        .style("background", d => (d === currentFilter ? "#7393b3" : "#f8f8f8"))
        .style("color", d => (d === currentFilter ? "white" : "black"))
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            currentFilter = d;
            sharedState.currentFilter = currentFilter; // 🔹 atualiza o estado global
            sharedState.notify();
            title.text(`${currentFilter} by Region`);
        
            // Update button styles
            filterControls.selectAll("button.filter")
                .style("background", b => (b === currentFilter ? "#7393b3" : "#f8f8f8"))
                .style("color", b => (b === currentFilter ? "white" : "black"));
        
            // Update legend for the new filter
            updateLegend(currentFilter);
            
            // Update map for current year
            updateMap(sharedState);
        });

    // SVG wrapper
    const svgBase = wrapper.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "73vh");

    const svg = svgBase.append("g")
        .attr("transform", "translate(80, 0)");

    // ========================
    // Legend
    // ========================
    function updateLegend(currentFilter) {
        // Remove previous legend before drawing a new one
        wrapper.select(".legend").remove();

        const legend = wrapper.append("div")
            .attr("class", "legend")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("gap", "10px")

        // Get the legend items for the current filter
        const range = sharedState.getEndYearIndex() - sharedState.getStartYearIndex()
        legendItems = getLegendItems(currentFilter, range);

        // Render legend
        legendItems.forEach(item => {
            const row = legend.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("gap", "6px");   

            row.append("div")
                .style("width", "14px")
                .style("height", "14px")
                .style("background-color", item.color)
                .style("border", "1px solid #999")
                .style("border-radius", "2px"); 

            row.append("span")
                .style("font-size", "14px")
                .text(item.label);
        });
    }

    // ========================
    // Map setup & update
    // ========================
    d3.json("./data/portugal_nuts3_2024.geojson").then(function (geoData) {
        // split features
        const azores = geoData.features.filter(f => f.properties.NUTS_ID.startsWith("PT20"));
        const madeira = geoData.features.filter(f => f.properties.NUTS_ID.startsWith("PT30"));
        const mainland = geoData.features.filter(f =>
            !f.properties.NUTS_ID.startsWith("PT20") && !f.properties.NUTS_ID.startsWith("PT30")
        );
    
        // === MAINLAND ===
        const mainlandProjection = d3.geoMercator().fitSize([width, height], {
            type: "FeatureCollection",
            features: mainland
        });
        const mainlandPath = d3.geoPath().projection(mainlandProjection);
    
        const mainlandGroup = svg.append("g").attr("class", "mainland-group");
    
        mainlandGroup.selectAll("path.region")
            .data(mainland, d => d.properties.NUTS_ID)
            .join(
                enter => enter.append("path")
                    .attr("class", "region mainland")
                    .attr("d", mainlandPath)
                    .attr("stroke", "#999")
                    .attr("stroke-width", 1)
                    .attr("fill", "#eee"),
                update => update.attr("d", mainlandPath),
                exit => exit.remove()
            );

        // inset scale (relative to mainland)
        const insetScale = 4;

        // positioning for insets (more spacing + balanced layout)
        const insetPadding = 30;

        // === MADEIRA INSET ===
        const madeiraBoxW = Math.round(width / insetScale);
        const madeiraBoxH = Math.round(height / insetScale);

        // place Madeira in the bottom-left corner
        const madeiraX = insetPadding;
        const madeiraY = height - madeiraBoxH - insetPadding;

        const madeiraProjection = d3.geoMercator()
            .fitSize([madeiraBoxW, madeiraBoxH], { type: "FeatureCollection", features: madeira });
        const madeiraPath = d3.geoPath().projection(madeiraProjection);
        
        const madeiraGroup = svg.append("g")
            .attr("class", "inset madeira")
            .attr("transform", `translate(${madeiraX}, ${madeiraY})`);
        
        madeiraGroup.append("rect")
            .attr("width", madeiraBoxW)
            .attr("height", madeiraBoxH)
            .attr("fill", "transparent")
            .attr("stroke", "#333")
            .on("mouseover", function (event) {
                const val = regionMap.get("Região Autónoma da Madeira");
                tooltip.transition().duration(200).style("opacity", 1);
                const [x, y] = d3.pointer(event, container.node());
                if(currentFilter!="Total Fires"){
                tooltip.html(`<strong>Região Autónoma da Madeira</strong><br/>${currentFilter}: ${val != null ? format3(val) : "N/A"}`)
                    .style("left", (x + 10) + "px")
                    .style("top", (y - 28) + "px");
                }else{
                    tooltip.html(`<strong>Região Autónoma da Madeira</strong><br/>${currentFilter}: ${val ?? "N/A"}`)
                        .style("left", (x + 10) + "px")
                        .style("top", (y - 28) + "px");
                }
            })
            .on("mousemove", function (event) {
                const [x, y] = d3.pointer(event, container.node());
                tooltip.style("left", (x + 10) + "px")
                    .style("top", (y - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .on("click", function() {
                if (sharedState.region != "Região Autónoma da Madeira") {
                    sharedState.setRegion("Região Autónoma da Madeira");
                } else {
                    sharedState.setRegion("Portugal");
                }
            });
        
        madeiraGroup.selectAll("path.region")
            .data(madeira, d => d.properties.NUTS_ID)
            .join(
                enter => enter.append("path")
                    .attr("class", "region inset madeira-path")
                    .attr("d", madeiraPath)
                    .attr("stroke", "#999")
                    .attr("stroke-width", 0.5)
                    .attr("fill", "#eee"),
                update => update.attr("d", madeiraPath),
                exit => exit.remove()
            );
        
        // === AZORES INSET ===
        const azoresBoxW = Math.round(width / insetScale);
        const azoresBoxH = Math.round(height / insetScale);

        // place Azores above Madeira with spacing
        const azoresX = insetPadding;
        const azoresY = madeiraY - azoresBoxH - insetPadding;

        const azoresProjection = d3.geoMercator()
            .fitSize([azoresBoxW, azoresBoxH], { type: "FeatureCollection", features: azores });
        const azoresPath = d3.geoPath().projection(azoresProjection);
        
        const azoresGroup = svg.append("g")
            .attr("class", "inset azores")
            .attr("transform", `translate(${azoresX}, ${azoresY})`);
        
        azoresGroup.append("rect")
            .attr("width", azoresBoxW)
            .attr("height", azoresBoxH)
            .attr("fill", "transparent")
            .attr("stroke", "#333")
            .on("mouseover", function (event) {
                const val = regionMap.get("Região Autónoma dos Açores");
                tooltip.transition().duration(200).style("opacity", 1);
                const [x, y] = d3.pointer(event, container.node());
                if(currentFilter!="Total Fires" && currentFilter!="Percentage Burned"){
                    tooltip.html(`<strong>Região Autónoma dos Açores</strong><br/>${currentFilter}: ${val != null ? format3(val) : "N/A"}`)
                        .style("left", (x + 10) + "px")
                        .style("top", (y - 28) + "px");
                } else{
                    tooltip.html(`<strong>Região Autónoma dos Açores</strong><br/>${currentFilter}: ${val ?? "N/A"}`)
                        .style("left", (x + 10) + "px")
                        .style("top", (y - 28) + "px");
                }
            })
            .on("mousemove", function (event) {
                const [x, y] = d3.pointer(event, container.node());
                tooltip.style("left", (x + 10) + "px")
                    .style("top", (y - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .on("click", function(event, d) {
                if (sharedState.region != "Região Autónoma dos Açores") {
                    sharedState.setRegion("Região Autónoma dos Açores");
                } else {
                    sharedState.setRegion("Portugal");
                }
            });
        
        azoresGroup.selectAll("path.region")
            .data(azores, d => d.properties.NUTS_ID)
            .join(
                enter => enter.append("path")
                    .attr("class", "region inset azores-path")
                    .attr("d", azoresPath)
                    .attr("stroke", "#999")
                    .attr("stroke-width", 0.5)
                    .attr("fill", "#eee"),
                update => update.attr("d", azoresPath),
                exit => exit.remove()
            );
        
        // helper to add the tooltip interaction (uses regionMap from updateMap closure)
        function addInteractivity(selection, regionMap) {
            selection
                .on("mouseover", function (event, d) {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    d3.select(this)
                        .style("opacity", 0.9) // Adiciona um pequeno efeito de hover no fill
                    
                    const [x, y] = d3.pointer(event, container.node());
                    tooltip.transition().duration(200).style("opacity", 1);
                    if(currentFilter!="Total Fires"){
                        tooltip.html(`<strong>${d.properties.NAME_LATN}</strong><br/>${currentFilter}: ${val != null ? format3(val) : "N/A"}`)
                            .style("left", (x + 10) + "px")
                            .style("top", (y - 28) + "px");
                    }else{
                        tooltip.html(`<strong>${d.properties.NAME_LATN}</strong><br/>${currentFilter}: ${val ?? "N/A"}`)
                        .style("left", (x + 10) + "px")
                        .style("top", (y - 28) + "px");
                    }
                })
                .on("mousemove", function (event) {
                    const [x, y] = d3.pointer(event, container.node());
                    tooltip.style("left", (x + 10) + "px")
                        .style("top", (y - 28) + "px");
                })
                .on("mouseout", function (event, d) {
                    d3.select(this).style("opacity", 1) // Remove o efeito de hover no fill
                    tooltip.transition().duration(200).style("opacity", 0);
                })
                .on("click", function(event, d) {
                    d3.select(this).style("opacity", 1);
                    if (sharedState.region != d.properties.NAME_LATN) {
                        sharedState.setRegion(d.properties.NAME_LATN);
                    } else {
                        sharedState.setRegion("Portugal");
                    }
                });
        }
    
        // Update function (applies to mainland + both insets)
        updateMap = function (sharedState) {
            const year = years[sharedState.getStartYearIndex()];
            const mapData = getData(sharedState.getStartYearIndex(), sharedState.getEndYearIndex(), sharedState.data, currentFilter);
            regionMap = new Map(mapData.map(d => [d.region, d.total]));
        
            // mainland
            mainlandGroup.selectAll("path.region")
                .data(mainland, d => d.properties.NUTS_ID)
                .join("path")
                .attr("d", mainlandPath)
                .transition()
                .duration(800)
                .attr("fill", d => {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    const range = sharedState.getEndYearIndex() - sharedState.getStartYearIndex()
                    return val !== undefined ? getColor(val, currentFilter, range) : missingDataColor;
                })
                .attr("stroke", d => d.properties.NAME_LATN === sharedState.region ? "#000" : "#999")   // cor do contorno
                .attr("stroke-width", d => d.properties.NAME_LATN === sharedState.region ? 3 : 0.6)
                .selection() // exit transition context
                .filter(d => d.properties.NAME_LATN === sharedState.region)
                .raise();
            
            
            // madeira inset
            madeiraGroup.selectAll("path.region")
                .data(madeira, d => d.properties.NUTS_ID)
                .join("path")
                .attr("d", madeiraPath)
                .transition()
                .duration(800)
                .attr("fill", d => {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    const range = sharedState.getEndYearIndex() - sharedState.getStartYearIndex()
                    return val !== undefined ? getColor(val, currentFilter, range) : missingDataColor;
                })
                .attr("stroke", d => d.properties.NAME_LATN === sharedState.region ? "#000" : "#999")   // cor do contorno
                .attr("stroke-width", d => d.properties.NAME_LATN === sharedState.region ? 3 : 0.6);
            
            // azores inset
            azoresGroup.selectAll("path.region")
                .data(azores, d => d.properties.NUTS_ID)
                .join("path")
                .attr("d", azoresPath)
                .transition()
                .duration(800)
                .attr("fill", d => {
                    const val = regionMap.get(d.properties.NAME_LATN);
                    const range = sharedState.getEndYearIndex() - sharedState.getStartYearIndex()
                    return val !== undefined ? getColor(val, currentFilter, range) : missingDataColor;
                })
                .attr("stroke", d => d.properties.NAME_LATN === sharedState.region ? "#000" : "#999")   // cor do contorno
                .attr("stroke-width", d => d.properties.NAME_LATN === sharedState.region ? 3 : 0.6);
            
            // attach tooltip interactivity (use the regionMap for current year)
            addInteractivity(mainlandGroup.selectAll("path.region"), regionMap);
            addInteractivity(madeiraGroup.selectAll("path.region"), regionMap);
            addInteractivity(azoresGroup.selectAll("path.region"), regionMap);
        };

        sharedState.onChange(state => {
            updateMap(state);
            updateLegend(currentFilter);
        });
    
        // initialize
        updateMap(sharedState);
        updateLegend(currentFilter);
    });
}