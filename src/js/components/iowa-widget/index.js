/*

Simple generic results table - used for prototyping the custom element code

*/

var dot = require("../../lib/dot");
var outerTemplate = require("./_outer.html");
var innerTemplate = dot.compile(require("./_inner.html"));
require("./iowa-widget.less");

var { formatAPDate, formatTime } = require("../utils");

var ElementBase = require("../elementBase");

var defaultRefresh = 15;

var fold = [
  "Biden",
  "Buttigieg",
  "Klobuchar",
  "Sanders",
  "Steyer",
  "Warren"
];

var mugs = require("../../../../data/mugs.sheet.json");

class IowaWidget extends ElementBase {
  constructor() {
    super();
    this.timeout = null;
    this.lastUpdated = null;
  }

  static get boundMethods() {
    return ["load"];
  }

  createShell() {
    this.innerHTML = outerTemplate;
    // connect the button
    var button = this.querySelector(".show-more");
    button.addEventListener("click", () => this.toggleAttribute("expanded"));
    return this.querySelector(".content");
  }

  toggleAttribute(attr) {
    var has = this.hasAttribute(attr);
    if (has) {
      this.removeAttribute(attr);
    } else {
      this.setAttribute(attr, "");
    }
    return !has;
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
    var contests = data.races;
    var first = contests[0];
    var { eevp } = first;
    var { precincts, reporting, reportingPercentage } = first.results[0];
    var timestamps = [].concat(...contests.map(d => d.results)).map(r => r.updated);
    var newest = Math.max(...timestamps);
    if (!this.lastUpdated || newest != this.lastUpdated) {
      var merged = {};
      var hasVotes = false;
      contests.forEach(function(contest) {
        contest.results[0].candidates.forEach(function(c) {
          if (c.votes) hasVotes = true;
          var merging = merged[c.last] || {
            last: c.last,
            first: c.first,
            mugshot: mugs[c.last] ? mugs[c.last].src : ""
          };
          // add fields from each feed type
          if (contest.id == "17275") {
            // SDEs and winner
            merging.sde = c.votes;
            merging.winner = c.winner;
            merging.percentage = c.percentage;
          } else {
            merging.votes = c.votes;
          }
          merged[c.last] = merging;
        });
      });
      var candidates = Object.keys(merged).map(m => merged[m]);
      var highest = candidates.map(c => c.percentage).sort((a, b) => a - b).pop();
      if (hasVotes) {
        candidates.sort(function(a, b) {
          return b.percentage - a.percentage;
        });
      } else {
        candidates.sort(function(a, b) {
          var aIndex = (fold.indexOf(a.last) + 1) || 100;
          var bIndex = (fold.indexOf(b.last) + 1) || 100;
          return aIndex - bIndex;
        });
      }

      var contentBlock = this.querySelector(".content");

      if (!contentBlock) {
        contentBlock = this.createShell();
      }

      this.lastUpdated = newest;
      contentBlock.innerHTML = innerTemplate({
        candidates,
        fold,
        highest
      });

      var updateElement = this.querySelector(".updated");
      var updated = new Date(newest);
      updateElement.innerHTML = `
${reportingPercentage}% of precincts reporting
(${reporting.toLocaleString()} of ${precincts.toLocaleString()}).
As of ${formatAPDate(updated)} at ${formatTime(updated)}.
      `;
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

window.customElements.define("iowa-widget", IowaWidget);
