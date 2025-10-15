function createTitle(sharedState, containerId) {
    const container = d3.select(containerId);

    // ========================
    // Setup
    // ========================
    const data = sharedState.data;
    const years = data.map(d => d.year);

    // ========================
    // Controls wrapper
    // ========================
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

    // Title
    controls.append("div")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-style", "italic")
        .text("Forest Fires in Portugal");

    // ========================
    // Year controls
    // ========================
    const yearControls = controls.append("div").style("margin", "8px 0");

    yearControls.append("button")
        .text("⟨")
        .on("click", () => {
            const index = sharedState.getYearIndex() - 1;
            if (index >= 0) sharedState.setYearIndex(index);
        });

    const yearLabel = yearControls.append("span")
        .style("margin", "0 10px")
        .style("font-weight", "bold")
        .text(years[sharedState.getYearIndex()]);

    yearControls.append("button")
        .text("⟩")
        .on("click", () => {
            const index = sharedState.getYearIndex() + 1;
            if (index < years.length) sharedState.setYearIndex(index);
        });

    sharedState.onChange(() => {
        yearLabel.text(years[sharedState.getYearIndex()]);
    });
}