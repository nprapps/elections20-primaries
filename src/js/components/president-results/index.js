var ElementBase = require("../elementBase");
require("./president-results.less");
var dot = require("../../lib/dot");
var tableTemplate = dot.compile(require("./_table.html"));

var { formatTime, formatAPDate } = require("../utils");

var mugs = require("../../../../data/mugs.sheet.json");
var defaultFold = Object.keys(mugs).filter(n => mugs[n].featured).sort();
var defaultMax = 6;

class PresidentResults extends ElementBase {

  constructor() {
    super();
    this.updated = null;
  }

  //override illuminate to add the button listener
  //this should still only happen once
  illuminate() {
    var elements = super.illuminate();
    elements.moreButton.addEventListener("click", () => this.toggleAttribute("expanded"));
    return elements;
  }

  render(data) {
    var elements = this.illuminate();

    elements.headline.innerHTML = `${data.party == "GOP" ? "GOP" : "Democratic"} primary results`;

    var result = data.results[0]; // only one for president
    var { caucus } = data;
    var { candidates, precincts, reporting, reportingPercentage, updated } = result;
    if (updated == this.updated) return;
    this.updated = updated;
    this.setAttribute("party", data.party);
    // assign mugs and normalize percentages
    candidates.forEach(function(c) {
      c.mugshot = mugs[c.last] ? mugs[c.last].src : "";
      c.percentage = c.percentage || 0;
    });
    // check for existing votes
    candidates.sort((a, b) => b.percentage - a.percentage);
    // resort if no votes are cast
    var hasVotes = !!candidates[0].percentage;
    if (!hasVotes) {
      // sort by default view, then by name
      candidates.sort(function(a, b) {
        var aValue = (defaultFold.indexOf(a.last) + 1) || (a.last == "Other" ? 101 : 100);
        var bValue = (defaultFold.indexOf(b.last) + 1) || (b.last == "Other" ? 101 : 100);
        if (aValue == bValue) {
          return a.last < b.last ? -1 : 1;
        }
        return aValue - bValue;
      });
    }

    // filter small candidates into others
    var others = candidates.filter(c => c.last == "Other").pop();
    if (!others) {
      others = {
        last: "Other",
        votes: 0,
        percentage: 0
      };
      if (caucus) {
        others.caucus = 0;
      }
      candidates.push(others);
    }
    candidates = candidates.filter(function(c) {
      if (c.last != "Other" && c.percentage < 1 && defaultFold.indexOf(c.last) == -1) {
        others.percentage += c.percentage;
        others.votes += c.votes;
        others.caucus += c.caucus;
        return false;
      }
      return true;
    });
    if (hasVotes && others.votes == 0) {
      candidates = candidates.filter(c => c != others);
    }

    var max = this.getAttribute("max") || defaultMax;
    var fold = candidates.slice(0, max).map(c => c.last);

    // decide if we need overflow
    if (candidates.length > fold.length) {
      this.setAttribute("overflow", "");
    } else {
      this.removeAttribute("overflow");
    }

    // insert content
    var highest = Math.max(...result.candidates.map(r => r.percentage || 0));
    elements.content.innerHTML = tableTemplate({ candidates, highest, fold, caucus });

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

PresidentResults.define("president-results");