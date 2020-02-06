var ElementBase = require("../elementBase");
require("./delegate-total.less");
var dot = require("../../lib/dot");
var template = dot.compile(require("./_template.html"));

var { formatTime, formatAPDate } = require("../utils");

var defaultRefresh = 60;

class DelegateTotal extends ElementBase {
  constructor() {
    super();
    this.timeout = null;
    this.etag = null;
  }

  static get boundMethods() {
    return ["load"]
  }

  connectedCallback() {
    this.load();
  }

  disconnectedCallback() {
    if (this.timeout) clearTimeout(this.timeout);
  }

  scheduleRefresh() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(this.load, 60 * 1000);
  }

  async load(src = this.getAttribute("src")) {
    this.scheduleRefresh();
    var response = await fetch(src, {
      headers: {
        "If-None-Match": this.etag
      }
    });

    if (response.status >= 400) this.innerHTML = template({ error: "Couldn't load report" });
    if (response.status == 304) return console.log("Delegate file is unchanged");

    var data = await response.json();
    var { needed, candidates } = data.sum.parties.Dem;
    var timestamp = new Date(data.sum.updated);
    var updated = `As of ${formatTime(timestamp)} on ${formatAPDate(timestamp)}`;

    candidates.sort((a, b) => b.total - a.total);
    candidates = candidates.slice(0, 3);

    this.innerHTML = template({ needed, candidates, updated });
  }
}

DelegateTotal.define("delegate-total");