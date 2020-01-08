/*

Simple generic results table - used for prototyping the custom element code

*/

var dot = require("../../lib/dot");
var template = dot.compile(require("./template.html"));
require("./results-table.less");

var { apDate, time } = require("../utils");

var ElementBase = require("../elementBase");

var defaultRefresh = 15;

class ResultsTable extends ElementBase {
  constructor() {
    super();
    this.timeout = null;
    this.lastUpdated = null;
  }

  static get boundMethods() {
    return ["load"];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.load(value);
        break;
    }
  }

  static get observedAttributes() {
    return ["src"];
  }

  static get mirroredProps() {
    return ["src"];
  }

  async load(src = this.getAttribute("src")) {
    var response = await fetch(src);
    if (response.status >= 300)
      return (this.innerHTML = "No data for this race");
    var contests = await response.json();
    var timestamps = [].concat(...contests.map(d => d.results)).map(r => r.updated);
    var newest = Math.max(...timestamps);
    if (!this.lastUpdated || newest != this.lastUpdated) {
      this.lastUpdated = newest;
      this.innerHTML = template({ contests, apDate, time });
    }
    if (this.hasAttribute("live")) this.scheduleRefresh();
  }

  scheduleRefresh() {
    if (this.timeout) clearTimeout(this.timeout);
    var interval = this.hasAttribute("refresh")
      ? this.getAttribute("refresh")
      : defaultRefresh;
    this.timeout = setTimeout(this.load, interval * 1000);
  }
}

window.customElements.define("results-table", ResultsTable);
