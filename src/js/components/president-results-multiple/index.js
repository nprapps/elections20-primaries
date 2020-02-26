var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./president-results-multiple.less");

var dot = require("../../lib/dot");
var candidateListTemplate = dot.compile(require("./_candidate_list.html"));
var resultTemplate = dot.compile(require("./_result.html"));
var headerTemplate = dot.compile(require("./_resultHeader.html"));

var { formatTime, formatAPDate, groupBy, toggleAttribute } = require("../utils");

var mugs = require("../../../../data/mugs.sheet.json");

// return a fresh object each time so we can mutate it
var getSchedule = function() {
  return {
    "7 p.m. ET": [
      { state: "VT", ap: "Vt.", delegates: 16 },
      { state: "VA", ap: "Va.", delegates: 99 }
    ],
    "7:30": [
      { state: "NC", ap: "N.C.", delegates: 110 }
    ],
    "8:00": [
      { state: "AL", ap: "Ala.", delegates: 52 },
      { state: "MN", ap: "Maine", delegates: 24 },
      { state: "MA", ap: "Mass.", delegates: 91 },
      { state: "OK", ap: "Okla.", delegates: 37 },
      { state: "TN", ap: "Tenn.", delegates: 64 }
    ],
    "8:30": [
      { state: "AR", ap: "Ark.", delegates: 52 }
    ],
    "9:00": [
      { state: "CO", ap: "Colo.", delegates: 52 },
      { state: "MN", ap: "Minn.", delegates: 64 },
      { state: "TX", ap: "Texas", delegates: 64 }
    ],
    "10:00": [
      { state: "UT", ap: "Utah", delegates: 52 }
    ],
    "11:00": [
      { state: "CA", ap: "Calif.", delegates: 52 }
    ]
  };
};

class PresidentResultsMultiple extends ElementBase {

  constructor() {
    super();
    // this is a place to keep local state
    // for example, we might make a variable for pagination
    this.page = 0;
    // we will also create a retriever for data
    this.fetch = new Retriever(this.load);
  }

  // bound methods will always have the correct `this` value
  static get boundMethods() {
    return [
      "load",
      "checkIfOverflow"
    ]
  }

  // direction is -1 for right, 1 for left
  shiftResults(direction = 1) {
    // console.log("next", e);
    var elements = this.illuminate();
    var resultLeft = elements.results.offsetLeft;
    var resultWidth = elements.results.offsetWidth;
    var resultWrapperWidth = elements.resultsWrapper.offsetWidth;
    var shiftIncrement = resultWrapperWidth * .7 * direction;

    var appliedShift = resultLeft + shiftIncrement;
    var remaining = resultWidth + appliedShift;

    // shift only if there's still something to see on the next "page"
    if (remaining < resultWrapperWidth) {
      appliedShift = resultWrapperWidth - 50 - resultWidth;
    }
    if (appliedShift > 0) {
      appliedShift = 0;
    }
    elements.results.style.left = appliedShift + 'px';
  }

  checkIfOverflow() {
    // show/hide pagination if necessary
    var elements = this.illuminate();
    var table = elements.resultsWrapper.querySelector(".results");
    var resultWidth = table.offsetWidth;
    var resultWrapperWidth = elements.resultsWrapper.offsetWidth;
    toggleAttribute(this, "overflow", resultWrapperWidth < resultWidth);
  }

  connectedCallback() {
    // we can illuminate in connected to template
    // but we'll more likely call it when we get data in load();
    this.illuminate();

    this.checkIfOverflow();
  }

  // attributes will only trigger the callback if they're observed
  static get observedAttributes() {
    return [ "src", "party" ];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value);
        break;
    }
  }

  illuminate() {
    // call the inherited illuminate function
    var elements = super.illuminate();
    // add event listeners (this will only run once)
    elements.nextButton.addEventListener("click", () => this.shiftResults(-1));
    elements.backButton.addEventListener("click", () => this.shiftResults(1));
    window.addEventListener("resize", this.checkIfOverflow);
    return elements;
  }

  load(data) {
    
    var elements = this.illuminate();

    this.toggleAttribute("test", !!data.test);

    var { races } = data;
    // filter to democratic races only
    var party = this.getAttribute("party");
    races = races.filter(d => d.party == party);
    // lookup table for races by state
    var stateRaces = {};
    // preprocess races for various metrics
    races.forEach(function(r) {
      // only one reporting unit, so simplify the structure
      r.results = r.results[0];
      var { reporting, reportingPercentage, precincts } = r.results;
      if (reporting > 0 && reportingPercentage < 1) {
        reportingPercentage = "<1";
      } else if (reporting < precincts && reportingPercentage > 99) {
        reportingPercentage = ">99";
      } else {
        reportingPercentage = reportingPercentage.toFixed(0);
      }
      r.results.reportingPercentage = reportingPercentage;
      var byName = {};
      r.results.candidates.forEach(function(c) {
        byName[c.last] = c;
        c.percentage = c.percentage || 0;
      });
      r.results.byName = byName;
      stateRaces[r.state] = r;
    });

    var latest = new Date(Math.max(...races.map(r => r.results.updated)));

    var updateString = `${formatAPDate(latest)} at ${formatTime(latest)}`;
    elements.updated.innerHTML = updateString;

    // filter mugs to active candidates from the active party
    var activeMugs = {};
    for (const cand in mugs) {
      if (mugs[cand].party == party && mugs[cand].active) {
        activeMugs[cand] = mugs[cand];
      }
    }

    elements.candidateList.innerHTML = candidateListTemplate({
      activeMugs
    });

    var schedule = getSchedule();

    // template!
    elements.resultsHeader.innerHTML = headerTemplate({ activeMugs });
    elements.results.innerHTML = resultTemplate({
      activeMugs,
      schedule,
      stateRaces
    });

    this.checkIfOverflow();

  }

  static get template() {
    return require("./_template.html");
  }

}

PresidentResultsMultiple.define("president-results-multiple");
