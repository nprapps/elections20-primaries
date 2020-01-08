/*

Simple generic results table - used for prototyping the custom element code

*/

var dot = require("../../lib/dot");
var template = dot.compile(require("./template.html"));
require("./style.less")

var ElementBase = require("../elementBase");

class ResultsTable extends ElementBase {

  constructor() {
    super();
  }

  connectedCallback() {

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

  disconnectedCallback() {

  }

  async load(src) {
    console.log(src);
    var response = await fetch(src);
    if (response.status >= 300) return;
    var data = await response.json();
    this.innerHTML = template(data);
  }

}

window.customElements.define("results-table", ResultsTable);