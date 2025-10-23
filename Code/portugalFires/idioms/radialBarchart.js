function createRadialBarchart(sharedState, containerId) {
    const container = d3.select(containerId);

    // Define colors for bar visualization
    const selectedBarColor = "green";
    const unselectedBarColor = "#A9A9A9";

    const data = sharedState.data;
    const regions = Array.from(new Set(data.flatMap(d => d.regions.map(r => r.region))));
    regions.unshift("Portugal");

    const width = window.innerWidth * 0.3;
    const height = window.innerHeight * 0.45;
    const minDim = Math.min(width, height);
    const innerR = minDim * 0.15;
    const outerR = minDim * 0.45;

    const tooltip = container.append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "6px 10px")
        .style("border", "1px solid #999")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const wrapper = container.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    const controls = wrapper.append("div")
        .attr("class", "controls")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")
        .style("margin-bottom", "12px")
        .style("gap", "6px");

    const titleElement = controls.append("div")
        .style("font-size", "18px")
        .style("font-weight", "bold");

    const horizontalContainer = wrapper.append("div")
        .style("display", "flex")
        .style("flex-direction", "row")
        .style("align-items", "flex-start")
        .style("justify-content", "center")
        .style("gap", "20px");

    const detailsBox = horizontalContainer.append("div")
        .attr("class", "radial-details")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "flex-start")
        .style("justify-content", "flex-start")
        .style("padding", "12px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("background-color", "#fafafa")
        .style("min-width", "160px")
        .style("font-size", "13px");

    const svgBase = horizontalContainer.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", width + "px")
        .style("height", height + "px");

    const svg = svgBase.append("g")
        .attr("transform", `translate(${width / 2},${height / 2.3})`);

    function polarToCartesian(angle, radius) {
        return {
            x: Math.cos(angle - Math.PI / 2) * radius,
            y: Math.sin(angle - Math.PI / 2) * radius
        };
    }

    // ========================
    // Função auxiliar para agregar dados por região e anos
    // ========================
    function aggregateRegionData(region, startIndex, endIndex, data) {
        const yearsData = data.slice(startIndex, endIndex + 1);
        let totalFires = 0;
        let totalArea = 0;
        let totalFirefighters = 0;
        let totalBurnedPercent = 0;

        yearsData.forEach(yr => {
            if(region === "Portugal") {
                yr.regions.forEach(r => {
                    totalFires += r.totalFires || 0;
                    totalArea += r.area || 0;
                    totalFirefighters += r.firefighters || 0;
                    totalBurnedPercent += r.percentBurned || 0;
                });
            } else {
                const r = yr.regions.find(r => r.region === region);
                if(r) {
                    totalFires += r.totalFires || 0;
                    totalArea += r.area || 0;
                    totalFirefighters += r.firefighters || 0;
                    totalBurnedPercent += r.percentBurned || 0;
                }
            }
        });

        const yearsCount = endIndex - startIndex + 1;
        const avgPercentBurned = yearsCount ? totalBurnedPercent / yearsCount : 0;

        return { totalFires, totalArea, totalFirefighters, avgPercentBurned };
    }


    // ========================
    // Update function
    // ========================
    function updateRadialBarChart(state) {
        svg.selectAll("*").remove();

        const filter = state.currentFilter || "Total Fires";
        const region = state.region;

        // 🔹 Calcular agregados para o intervalo de anos selecionado
        const startIndex = state.startYearIndex;
        const endIndex = state.endYearIndex;
        const yearsData = state.data.slice(startIndex, endIndex + 1);

        let totalFires = 0;
        let totalArea = 0;
        let totalSapadores = 0;
        let totalPercentagem = 0;
        let totalEficaciaIndex = 0;
        let totalPrevencaoIndex = 0;

        yearsData.forEach(yr => {
            if (region === "Portugal") {
                yr.regions.forEach(r => {
                    totalFires += r.total || 0;
                    totalArea += r.area || 0;
                    totalSapadores += r.sapadores || 0;
                    totalPercentagem += r.percentagem || 0;
                    totalEficaciaIndex += r.eficaciaIndex || 0;
                    totalPrevencaoIndex += r.prevencaoIndex || 0;
                });
            } else {
                const r = yr.regions.find(r => r.region === region);
                if (r) {
                    totalFires += r.total || 0;
                    totalArea += r.area || 0;
                    totalSapadores += r.sapadores || 0;
                    totalPercentagem += r.percentagem || 0;
                    totalEficaciaIndex += r.eficaciaIndex || 0;
                    totalPrevencaoIndex += r.prevencaoIndex || 0;
                }
            }
        });

        const yearsCount = endIndex - startIndex + 1;
        const avgEficacia = yearsCount ? totalEficaciaIndex / yearsCount : 0;
        const avgPrevencao = yearsCount ? totalPrevencaoIndex / yearsCount : 0;
        const avgPercentagem = yearsCount ? totalPercentagem / yearsCount : 0;

        // 🔹 Atualizar a details box
        let html = `<div style="font-weight:bold; margin-bottom:6px;">Details</div>`;
        html += `<div><strong>Region:</strong> ${region}</div>`;
        html += `<div><strong>Period:</strong> ${state.data[startIndex].year} - ${state.data[endIndex].year}</div>`;

        switch (filter) {
            case "Total Fires":
                html += `<div><strong>Total Fires:</strong> ${totalFires}</div>`;
                break;

            case "Prevention Index":
                const preventionIndex = totalArea && totalSapadores ? (totalSapadores / totalArea).toFixed(3) : "N/A";
                html += `
                    <div><strong>Total Area:</strong> ${totalArea} km²</div>
                    <div><strong>Number of Firefighters:</strong> ${totalSapadores}</div>
                    <div><strong>Formula:</strong> nFirefighters/TotalArea</div>
                    <div><strong>Average Result:</strong> ${preventionIndex}</div>
                `;
                break;

            case "Efficiency Index":
                const efficiencyIndex = totalFires && totalSapadores ? (totalSapadores / totalFires).toFixed(3) : "N/A";
                html += `
                    <div><strong>Total Fires:</strong> ${totalFires}</div>
                    <div><strong>Number of Firefighters:</strong> ${totalSapadores}</div>
                    <div><strong>Formula:</strong> nFirefighters/Total Fires</div>
                    <div><strong>Average Result:</strong> ${efficiencyIndex}</div>
                `;
                break;

            case "Percentage Burned":
                const areaArdidaKm2 = (totalArea * (avgPercentagem / 100)).toFixed(2);
                html += `
                    <div><strong>Total Area:</strong> ${totalArea} km²</div>
                    <div><strong>Average Burned Area:</strong> ${avgPercentagem.toFixed(2)}%</div>
                    <div><strong>Equivalent in km²:</strong> ${areaArdidaKm2}</div>
                `;
                break;

            default:
                html += `<div>No data.</div>`;
                break;
        }

        detailsBox.html(html);

        // 🔹 Dados para o radial chart
        const totalsByYear = getTotals(state.region, state.data);
        const maxValue = d3.max(totalsByYear, d => d.total ?? 0) || 0;

        const startYear = state.data[state.startYearIndex]?.year;
        const endYear = state.data[state.endYearIndex]?.year;

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
            .endAngle(d => angleScale(d.total ?? 0));

        const getBarColor = (year) => (year >= startYear && year <= endYear) ? selectedBarColor : unselectedBarColor;

        // Desenhar ticks
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

        // Desenhar barras
        const bars = svg.selectAll("path").data(totalsByYear, d => d.year);

        bars.exit().remove();

        bars.enter()
            .append("path")
            .attr("fill", d => getBarColor(d.year))
            .attr("d", d => arc({ ...d, total: 0 }))
            .merge(bars)
            .transition()
            .duration(800)
            .attrTween("d", function(d) {
                const i = d3.interpolate(0, d.total ?? 0);
                return t => arc({ ...d, total: i(t) });
            })
            .attr("fill", d => getBarColor(d.year));

        // Tooltip
        svg.selectAll("path")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "orange");
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.year}</strong><br/>Total fires: ${d.total ?? 0}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("fill", getBarColor(d.year));
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .on("click", function(event, d) {
                const newIndex = state.data.findIndex(yr => yr.year === d.year);
                sharedState.setStartYearIndex(newIndex);
                sharedState.setEndYearIndex(newIndex);
            });

        // Labels dos anos
        svg.selectAll(".year-label")
            .data(totalsByYear)
            .enter()
            .append("text")
            .attr("class", "year-label")
            .attr("x", -6)
            .attr("y", d => -bandScale(d.year) - bandScale.bandwidth() / 2 + barPadding)
            .attr("text-anchor", "end")
            .style("alignment-baseline", "middle")
            .style("font-size", `${Math.max(6, bandScale.bandwidth() * 0.4)}px`)
            .text(d => d.year);
    }


    // ========================
    // Escuta mudanças no estado
    // ========================
    sharedState.onChange(state => {
        updateRadialBarChart(state);
    });

    // ========================
    // Desenho inicial
    // ========================
    updateRadialBarChart(sharedState);
}
