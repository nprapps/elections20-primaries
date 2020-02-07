var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./delegate-total.less");
var dot = require("../../lib/dot");
var template = dot.compile(require("./_template.html"));

var { formatTime, formatAPDate } = require("../utils");

var defaultRefresh = 60;

class DelegateTotal extends ElementBase {
  constructor() {
    super();
    this.fetch = new Retriever(this.load);
  }

  static get boundMethods() {
    return ["load"]
  }

  connectedCallback() {
    this.fetch.start();
  }

  disconnectedCallback() {
    this.fetch.stop();
  }

  static get observedAttributes() {
    return ["src"]
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value, 60);
        break;
    }
  }

  load(data) {
    var { needed, candidates } = data.sum.parties.Dem;
    var timestamp = new Date(data.sum.updated);
    var updated = `As of ${formatTime(timestamp)} on ${formatAPDate(timestamp)}`;

    candidates.sort((a, b) => b.total - a.total);
    candidates = candidates.slice(0, 3);

    this.innerHTML = template({ needed, candidates, updated });
  }
}

DelegateTotal.define("delegate-total");