class SharedState {
  constructor(data, region, yearIndex) {
    this.data = data;
    this.region = region;
    this.yearIndex = yearIndex;
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

  setYearIndex(yearIndex) {
    this.yearIndex = yearIndex;
    this.notify();
  }

  getYearIndex() {
    return this.yearIndex;
  }
}
