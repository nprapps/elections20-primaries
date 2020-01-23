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

var defaultFold = [
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
    var link = this.querySelector(".full-results");
    link.href = this.getAttribute("href");
    var content = this.querySelector(".content");
    this.createShell = () => content;
    return content;
  }

  toggleAttribute(attr, force) {
    var has = typeof force != "undefined" ? !force : this.hasAttribute(attr);
    if (has) {
      this.removeAttribute(attr);
    } else {
      this.setAttribute(attr, "");
    }
    return !has;
  }

  attributeChangedCallback(attr, was, value) {
    if (was == value) return;
    switch (attr) {
      case "src":
        this.load(value);
        break;

      case "href":
        var link = this.querySelector(".full-results");
        if (link) link.href = value;
    }
  }

  static get observedAttributes() {
    return ["src", "href", "expanded"];
  }

  static get mirroredProps() {
    return ["src", "href", "expanded"];
  }

  async load(src = this.getAttribute("src")) {
    var response = await fetch(src);
    if (response.status >= 300)
      return (this.innerHTML = "No data for this race");
    var data = await response.json();
    var { test, closing, chatter, footnote } = data;
    this.toggleAttribute("test", !!test);

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
            merging.percentage = c.percentage || 0;
          } else {
            merging.votes = c.votes;
          }
          merged[c.last] = merging;
        });
      });
      // merge the other candidate
      var other = merged.Other;
      Object.keys(merged).forEach(function(k) {
        if (k == "Other") return;
        var candidate = merged[k];
        if (candidate.percentage < 1) {
          delete merged[k];
          other.votes += candidate.votes;
          other.percentage += candidate.percentage;
          other.sde += candidate.sde;
        }
      })
      var candidates = Object.keys(merged).map(m => merged[m]);
      var highest = candidates.map(c => c.percentage).sort((a, b) => a - b).pop();
      var fold = defaultFold;
      if (hasVotes) {
        candidates.sort(function(a, b) {
          var aP = a.last == "Other" ? -1 : a.percentage;
          var bP = b.last == "Other" ? -1 : b.percentage;
          return bP - aP;
        });
        fold = candidates.map(c => c.last).slice(0, 6);
      } else {
        candidates.sort(function(a, b) {
          var aIndex = a.last == "Other" ? 101 : (fold.indexOf(a.last) + 1) || 100;
          var bIndex = b.last == "Other" ? 101 : (fold.indexOf(b.last) + 1) || 100;
          return aIndex - bIndex;
        });
      }
      
      var contentBlock = this.querySelector(".content");

      if (!contentBlock) {
        contentBlock = this.createShell();
      }

      this.lastUpdated = newest;
      contentBlock.innerHTML = innerTemplate({
        chatter,
        footnote,
        candidates,
        fold,
        highest
      });

      // adjust reporting numbers
      if (reporting > 0 && reportingPercentage < 1) {
        reportingPercentage = "<1";
      } else if (reporting < precincts && reportingPercentage == 100) {
        reportingPercentage = ">99";
      } else {
        reportingPercentage = reportingPercentage.toFixed(1);
      }
      var updateElement = this.querySelector(".updated");
      var updated = new Date(newest);
      var updateString = `
${reportingPercentage}% of precincts reporting
(${reporting.toLocaleString()} of ${precincts.toLocaleString()}).
As of ${formatAPDate(updated)} at ${formatTime(updated)}.
      `;
      updateElement.innerHTML = hasVotes ? updateString : `First results expected after ${closing}`;
      var footnoteElement = this.querySelector(".footnote");
      footnoteElement.innerHTML = footnote;
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
