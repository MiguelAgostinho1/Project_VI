class SharedState {
  constructor(data, region, startYearIndex, endYearIndex) {
    this.data = data;
    this.region = region;
    this.startYearIndex = startYearIndex;
    this.endYearIndex = endYearIndex;
    this.listeners = [];
  }

  // Add a listener callback
  onChange(callback) {
    this.listeners.push(callback);
  }

  // Internal trigger
  notify() {
    this.listeners.forEach(cb => cb(this));
  }

  // Setters that notify others
  setRegion(region) {
    this.region = region;
    this.notify();
  }

  setStartYearIndex(yearIndex) {
    this.startYearIndex = yearIndex;
    this.notify();
  }

  getStartYearIndex() {
    return this.startYearIndex;
  }

  setEndYearIndex(yearIndex) {
    this.endYearIndex = yearIndex;
    this.notify();
  }

  getEndYearIndex() {
    return this.endYearIndex;
  }
}
