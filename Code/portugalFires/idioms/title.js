function createTitle(sharedState, containerId) {
    const container = d3.select(containerId);

    // ========================
    // Setup
    // ========================
    const data = sharedState.data;
    const years = data.map(d => d.year);
    const minIndex = 0;
    const maxIndex = years.length - 1;

    // Assuming a reasonable width for the slider
    const SLIDER_WIDTH = 300;
    // Increased height to accommodate the labels above the track
    const SLIDER_HEIGHT = 60; 
    const HANDLE_RADIUS = 8;
    const MARGIN = 20;
    const TRACK_Y = SLIDER_HEIGHT * 0.75; // Position the track lower to leave space for labels

    // Linear scale to map year index to SVG pixel position (X)
    const xScale = d3.scaleLinear()
        .domain([minIndex, maxIndex])
        .range([MARGIN, SLIDER_WIDTH - MARGIN]);

    // ========================
    // Controls wrapper
    // ========================
    // Vertical wrapper
    const wrapper = container.append("div")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center");

    // Controls wrapper (title + slider)
    const controls = wrapper.append("div")
        .attr("class", "controls")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("align-items", "center")

    // Title
    controls.append("div")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-style", "italic")
        .text("Forest Fires in Portugal");

    // ========================
    // Year controls (Custom D3 Slider)
    // ========================
    // Create the SVG container for the slider
    const svg = controls.append("svg")
        .attr("width", SLIDER_WIDTH)
        .attr("height", SLIDER_HEIGHT);

    // 1. Draw the slider track
    svg.append("line")
        .attr("class", "slider-track")
        .attr("x1", xScale(minIndex))
        .attr("x2", xScale(maxIndex))
        .attr("y1", TRACK_Y)
        .attr("y2", TRACK_Y)
        .style("stroke", "#ccc")
        .style("stroke-width", 6)
        .style("stroke-linecap", "round");
        
    // 2. Draw the connection between handles (highlighted range)
    const rangeLine = svg.append("line")
        .attr("class", "slider-range")
        .attr("y1", TRACK_Y)
        .attr("y2", TRACK_Y)
        .style("stroke", "#7393b3")
        .style("stroke-width", 6)
        .style("stroke-linecap", "round");


    // 3. Create the handles (start and end)
    const startHandle = svg.append("circle")
        .attr("class", "handle start")
        .attr("r", HANDLE_RADIUS)
        .attr("cy", TRACK_Y)
        .style("fill", "#7393b3")
        .style("cursor", "ew-resize");

    const endHandle = svg.append("circle")
        .attr("class", "handle end")
        .attr("r", HANDLE_RADIUS)
        .attr("cy", TRACK_Y)
        .style("fill", "#7393b3")
        .style("cursor", "ew-resize");
        
    // 4. Create the labels (new elements)
    const startLabel = svg.append("text")
        .attr("class", "handle-label start-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "ideographic")
        .attr("y", TRACK_Y - HANDLE_RADIUS - 5) // Position slightly above the handle
        .style("font-weight", "bold");

    const endLabel = svg.append("text")
        .attr("class", "handle-label end-label")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "ideographic")
        .attr("y", TRACK_Y - HANDLE_RADIUS - 5) // Position slightly above the handle
        .style("font-weight", "bold");

    
    // Function to update all visual elements (handles, range line, labels)
    function updateVisuals(startIndex, endIndex) {
        // Calculate new X positions
        const startX = xScale(startIndex);
        const endX = xScale(endIndex);

        // Update handle positions
        startHandle.attr("cx", startX);
        endHandle.attr("cx", endX);

        // Update range line position
        rangeLine.attr("x1", startX).attr("x2", endX);

        // Update label positions and text
        startLabel.attr("x", startX).text(years[startIndex]);
        endLabel.attr("x", endX).text(years[endIndex]);
    }

    // Initial draw
    updateVisuals(sharedState.getStartYearIndex(), sharedState.getEndYearIndex());


    // 5. Implement D3 Drag Behavior
    
    // Function to snap a pixel X position to the nearest year index
    function getIndexFromX(x) {
        const rawIndex = xScale.invert(x);
        let snappedIndex = Math.round(rawIndex);
        return Math.max(minIndex, Math.min(maxIndex, snappedIndex));
    }

    // Drag behavior for the START handle
    const startDrag = d3.drag()
        .on("drag", function(event) {
            let startIndex = sharedState.getStartYearIndex();
            let endIndex = sharedState.getEndYearIndex();

            // Check for CO-LOCATION
            if (startIndex === endIndex) {
                let currentX = xScale(startIndex);
                let newX = event.x;
                let newIndex = getIndexFromX(newX);
                
                // If dragging right (newX > currentX) AND index is changing, EXPAND RIGHT
                if (newX > currentX && newIndex > startIndex) {
                    // ACTION: Update ONLY the END Index
                    if (newIndex <= maxIndex) {
                        sharedState.setEndYearIndex(newIndex);
                        updateVisuals(startIndex, newIndex);
                    }
                    return;
                }
                
                // If dragging left (newX < currentX) AND index is changing, EXPAND LEFT
                if (newX < currentX && newIndex < startIndex) {
                    // ACTION: Update ONLY the START Index
                    if (newIndex >= minIndex) {
                        sharedState.setStartYearIndex(newIndex);
                        updateVisuals(newIndex, endIndex);
                    }
                    return;
                }
            }
            
            // NORMAL MODE (Contraction/Range Update)
            let maxAllowedX = xScale(endIndex);
            
            let newX = Math.max(xScale(minIndex), Math.min(maxAllowedX, event.x));
            let newIndex = getIndexFromX(newX);
            
            newIndex = Math.min(newIndex, endIndex); 
            
            if (newIndex !== startIndex) {
                sharedState.setStartYearIndex(newIndex);
                updateVisuals(sharedState.getStartYearIndex(), sharedState.getEndYearIndex());
            }
        }
    );
        
    // Drag behavior for the END handle
    const endDrag = d3.drag()
        .on("drag", function(event) {
            let startIndex = sharedState.getStartYearIndex();
            let endIndex = sharedState.getEndYearIndex();

            // Check for CO-LOCATION
            if (startIndex === endIndex) {
                let currentX = xScale(endIndex);
                let newX = event.x;
                let newIndex = getIndexFromX(newX);

                // If dragging right (newX > currentX) AND index is changing, EXPAND RIGHT
                if (newX > currentX && newIndex > endIndex) {
                    // ACTION: Update ONLY the END Index
                    if (newIndex <= maxIndex) {
                        sharedState.setEndYearIndex(newIndex);
                        updateVisuals(startIndex, newIndex);
                    }
                    return;
                }
                
                // If dragging left (newX < currentX) AND index is changing, EXPAND LEFT
                if (newX < currentX && newIndex < endIndex) {
                    // ACTION: Update ONLY the START Index
                    if (newIndex >= minIndex) {
                        sharedState.setStartYearIndex(newIndex);
                        updateVisuals(newIndex, endIndex);
                    }
                    return;
                }
            }
            
            // NORMAL MODE (Contraction/Range Update)
            let minAllowedX = xScale(startIndex);
            let newX = Math.min(xScale(maxIndex), Math.max(minAllowedX, event.x));
            let newIndex = getIndexFromX(newX);
            
            newIndex = Math.max(newIndex, startIndex);
            
            if (newIndex !== endIndex) {
                sharedState.setEndYearIndex(newIndex);
                updateVisuals(sharedState.getStartYearIndex(), sharedState.getEndYearIndex());
            }
        }
    );

    // Apply the drag handlers
    startHandle.call(startDrag);
    endHandle.call(endDrag);

    // 6. Shared State Change Handler
    sharedState.onChange(() => {
        const startIndex = sharedState.getStartYearIndex();
        const endIndex = sharedState.getEndYearIndex();
        updateVisuals(startIndex, endIndex);
    });
}