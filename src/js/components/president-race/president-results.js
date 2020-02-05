var ElementBase = require("../elementBase");
require("./president-results.less");
var dot = require("../../lib/dot");
var tableTemplate = dot.compile(require("./_table.html"));

var { formatTime, formatAPDate } = require("../utils");

var mugs = require("../../../../data/mugs.sheet.json");
var defaultFold = Object.keys(mugs).filter(n => mugs[n].featured).sort();

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

  set race(data) {
    var elements = this.illuminate();
    elements.headline.innerHTML = `${data.party == "GOP" ? "GOP" : "Democratic"} primary results`;
    var result = data.results[0]; // only one for president
    var { candidates, precincts, reporting, reportingPercentage, updated } = result;
    if (updated == this.updated) return;
    this.updated = updated;
    this.setAttribute("party", data.party);
    // assign mugs
    candidates.forEach(c => c.mugshot = mugs[c.last] ? mugs[c.last].src : "");
    candidates.sort((a, b) => b.percentage - a.percentage);
    var others = candidates.filter(c => c.last == "Other").pop();
    if (!others) {
      others = {
        last: "Other",
        votes: 0,
        percentage: 0
      };
      candidates.push(others);
    }
    // filter small candidates into others
    candidates = candidates.filter(function(c) {
      if (c.last != "Other" && c.percentage < 1) {
        others.percentage += c.percentage;
        others.votes += c.votes;
        return false;
      }
      return true;
    });
    if (!candidates[0].percentage) {
      // sort by default view, then by name
      candidates.sort(function(a, b) {
        var aValue = defaultFold.indexOf(a.last) + 1 || a.last == "Other" ? 101 : 100;
        var bValue = defaultFold.indexOf(b.last) + 1 || a.last == "Other" ? 101 : 100;
        if (aValue == bValue) {
          return a.last < b.last ? -1 : 1;
        }
        return aValue - bValue;
      });
    }
    var fold = candidates.slice(0, 6).map(c => c.last);
    var highest = Math.max(...result.candidates.map(r => r.percentage || 0));
    elements.content.innerHTML = tableTemplate({ candidates, highest, fold });

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
    // elements.chatter.innerHTML = chatter; 
    // elements.footnote.innerHTML = footnote;
  }

  static get template() {
    return require("./_shell.html");
  }

}

PresidentResults.define("president-results");