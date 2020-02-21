/*

Simple generic results table - used for prototyping the custom element code

*/

var dot = require("../../lib/dot");
var table = dot.compile(require("./_table.html"));
require("./results-table.less");

var { formatAPDate, formatTime } = require("../utils");

var ElementBase = require("../elementBase");

var mugs = require("../../../../data/mugs.sheet.json");
var defaultFold = Object.keys(mugs)
  .filter(k => mugs[k].featured)
  .sort();

var defaultRefresh = 15;
var defaultMax = 4;

var sortIndex = item =>
  defaultFold.indexOf(item.last) + 1 || (item.last == "Other" ? 101 : 100);

class ResultsTable extends ElementBase {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ["href"];
  }

  attributeChangedCallback(attr, was, value) {
    var elements = this.illuminate();

    switch (attr) {
      case "href":
        elements.resultsLink.href = value || "";
        break;
    }
  }

  render(result) {
    var elements = this.illuminate();

    if (result.seat) elements.headline.innerHTML = result.seat;

    var {
      candidates,
      precincts,
      reporting,
      reportingPercentage,
      updated
    } = result;
    if (updated == this.updated) return;
    this.updated = updated;
    this.setAttribute("party", result.party);
    // normalize percentages
    candidates.forEach(function(c) {
      c.percentage = c.percentage || 0;
    });
    // check for existing votes
    candidates.sort((a, b) => b.percentage - a.percentage);
    // re-sort if no votes are cast
    var hasVotes = !!candidates[0].percentage;
    if (!hasVotes) {
      // sort by default view, then by name
      candidates.sort(function(a, b) {
        var aValue = sortIndex(a);
        var bValue = sortIndex(b);
        if (aValue == bValue) {
          return a.last < b.last ? -1 : 1;
        }
        return aValue - bValue;
      });
    }

    // filter small candidates into others
    var [others] = candidates.filter(c => c.last == "Other");
    if (!others) {
      others = {
        last: "Other",
        votes: 0,
        percentage: 0
      };
      candidates.push(others);
    }
    candidates = candidates.filter(function(c) {
      if (
        c.last != "Other" &&
        c.percentage < 1 &&
        defaultFold.indexOf(c.last) == -1
      ) {
        others.percentage += c.percentage;
        others.votes += c.votes;
        return false;
      }
      return true;
    });
    // remove it if empty
    if (!others.votes) {
      candidates = candidates.filter(c => c != others);
    }

    // decide if we need overflow
    var max = this.getAttribute("max") || defaultMax;
    var fold = candidates.slice(0, max).map(c => c.last);
    if (candidates.length > fold.length) {
      this.setAttribute("overflow", "");
    } else {
      this.removeAttribute("overflow");
    }

    // insert content
    var highest = Math.max(...result.candidates.map(r => r.percentage || 0));
    elements.content.innerHTML = table({ candidates, highest, fold });

    // adjust reporting numbers
    if (reporting > 0 && reportingPercentage < 1) {
      reportingPercentage = "<1";
    } else if (reporting < precincts && reportingPercentage == 100) {
      reportingPercentage = ">99";
    } else {
      reportingPercentage = reportingPercentage.toFixed(0);
    }
    var updated = new Date(updated);
    var updateString = `as of ${formatTime(updated)} on ${formatAPDate(updated)}`;
    elements.updated.innerHTML = updateString;

    var reportingString = `${reportingPercentage}% of precincts reporting`;
    elements.reporting.innerHTML = reportingString;
    elements.resultsLink.href = this.getAttribute("href");
  }

  static get template() {
    return require("./_template.html");
  }
}

ResultsTable.define("results-table");
