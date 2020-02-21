var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./liveblog-headlines.less");
var dot = require("../../lib/dot");
var template = dot.compile(require("./_template.html"));

var { formatTime, formatAPDate } = require("../utils");

var defaultRefresh = 60;

class LiveblogHeadlines extends ElementBase {
  constructor() {
    super();
    this.fetch = new Retriever(this.load);
    this.innerHTML = template();
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
    // this.innerHTML = template();
  }
}

LiveblogHeadlines.define("liveblog-headlines");
