/*

Simple generic results table - used for prototyping the custom element code

*/

var dot = require("../../lib/dot");
var template = dot.compile(require("./template.html"));
require("./style.less");

var ElementBase = require("../elementBase");

var defaultRefresh = 15;

class ResultsTable extends ElementBase {
  constructor() {
    super();
    this.timeout = null;
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
    var data = await response.json();
    this.innerHTML = template(data);
    if (this.hasAttribute("live")) this.scheduleRefresh();
  }

  scheduleRefresh() {
    if (this.timeout) clearTimeout(this.timeout);
    var interval = this.hasAttribute("refresh")
      ? this.getAttribute("refresh")
      : defaultRefresh;
    this.timeout = setTimeout(() => this.load(), interval * 1000);
  }
}

window.customElements.define("results-table", ResultsTable);
