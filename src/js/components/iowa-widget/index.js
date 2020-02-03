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
    this.etag = "";
  }

  static get boundMethods() {
    return ["load"];
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
    var { resultsLink } = this.illuminate();
    if (was == value) return;
    switch (attr) {
      case "src":
        this.load(value);
        break;

      case "href":
        resultsLink.href = value;
        break;
    }
  }

  connectedCallback() {
    if (!this.timeout) this.load();
  }

  disconnectedCallback() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
  }

  static get template() {
    return outerTemplate;
  }

  //override illuminate to add the button listener
  //this should still only happen once
  illuminate() {
    var elements = super.illuminate();
    elements.moreButton.addEventListener("click", () => this.toggleAttribute("expanded"));
    elements.resultsLink.href = this.getAttribute("href");
    elements.headline = this.getAttribute("headline").trim();
    return elements;
  }

  static get observedAttributes() {
    return ["src", "href", "expanded"];
  }

  static get mirroredProps() {
    return ["src", "href", "expanded"];
  }

  async load(src = this.getAttribute("src")) {
    //schedule now in case the fetch fails
    if (this.hasAttribute("live")) this.scheduleRefresh();

    if (!src) return;

    var response = await fetch(src, {
      headers: {
        "If-None-Match": this.etag
      }
    });
    this.etag = response.headers.get("etag");
    if (response.status >= 400)
      return (this.innerHTML = "No data for this race");
    if (response.status == 304)
      return; // No change since last request
    var data = await response.json();
    var { test, closing, chatter, footnote } = data;
    this.toggleAttribute("test", !!test);

    var contests = data.races;
    var first = contests[0];
    var { eevp } = first;
    if (!first.results.length) {
      return this.innerHTML = "No results available yet.";
    }
    var { precincts, reporting, reportingPercentage } = first.results[0];
    var timestamps = [].concat(...contests.map(d => d.results)).map(r => r.updated);
    var newest = Math.max(...timestamps);

    if (!this.lastUpdated || newest != this.lastUpdated) {
      var merged = {};
      var hasVotes = false;
      contests.forEach(function(contest) {
        contest.results[0].candidates.forEach(function(c) {
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
            if (merging.percentage) hasVotes = true;
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
        if (hasVotes && candidate.percentage < 1) {
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

      var elements = this.illuminate();

      this.lastUpdated = newest;
      elements.content.innerHTML = innerTemplate({
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
        reportingPercentage = reportingPercentage.toFixed(0);
      }
      var updated = new Date(newest);
      var updateString = `as of ${formatTime(updated)} on ${formatAPDate(updated)}`;
      elements.updated.innerHTML = updateString;

      var reportingString = `
${reportingPercentage}% of precincts reporting
      `;
      elements.reporting.innerHTML = hasVotes ? reportingString : `First results expected after ${closing}`;
      elements.chatter.innerHTML = chatter;
      elements.footnote.innerHTML = footnote;
    }
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
