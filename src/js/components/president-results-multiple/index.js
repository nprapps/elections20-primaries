var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./president-results-multiple.less");

var $ = require("../../lib/qsa");
var dot = require("../../lib/dot");
var candidateListTemplate = dot.compile(require("./_candidate_list.html"));
var resultTemplate = dot.compile(require("./_result.html"));
var headerTemplate = dot.compile(require("./_resultHeader.html"));

var { formatTime, formatAPDate, groupBy, toggleAttribute } = require("../utils");

const LEADER_THRESHOLD = 25;

var mugs = require("mugs.sheet.json");
var scheduleInfo = require("./schedules.json");

// return a fresh object each time so we can mutate it
var getSchedule = function(lineup) {
  return scheduleInfo[lineup].schedule;
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
      "checkIfOverflow",
      "onHover"
    ]
  }

  onHover(e) {
    var target = e.target;
    var cell = target.closest("[data-candidate]");
    $(".hover", this).forEach(el => el.classList.remove("hover"));
    if (e.type == "mousemove" && cell) {
      var row = $(`[data-candidate="${cell.dataset.candidate}"]`, this);
      row.forEach(el => el.classList.add("hover"));
    }
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
    return [ "src", "party", "lineup" ];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value, 15);
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
    elements.results.addEventListener("mousemove", this.onHover);
    elements.results.addEventListener("mouseleave", this.onHover);
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
    races.forEach(function(r, i) {
      var leader = null;
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
      var byName = {};
      var hasPercentage = r.results.candidates.some(c => c.percentage);
      r.results.candidates.forEach(function(c) {
        byName[c.last] = c;
        var { percentage } = c;
        if (!reporting && !hasPercentage) {
          percentage = percentage ||  c.winner ? "✓" : "-";
        } else {
          percentage = percentage || "0.0%";
        }
        if (typeof percentage == "number") {
          percentage = percentage.toFixed(1) + "%";
          if (c.winner) percentage += " ✓";
        }
        if (r.results.reportingPercentage > LEADER_THRESHOLD) {
          if (c.percentage && (!leader || leader.percentage < c.percentage)) {
            leader = c;
          }
        }
        c.displayPercentage = percentage;
      });
      r.results.reportingPercentage = reportingPercentage;
      r.results.byName = byName;
      r.results.leader = leader;
      stateRaces[r.state] = r;
    });

    var latest = new Date(Math.max(...races.map(r => r.results.updated)));

    var updateString = `as of ${formatAPDate(latest)} at ${formatTime(latest)}`;
    elements.updated.innerHTML = updateString;

    // filter mugs to active candidates for this race
    var lineup = this.getAttribute("lineup");
    var activeMugs = {};
    scheduleInfo[lineup].candidates.forEach(function(c) {
      activeMugs[c] = mugs[c];
    })

    elements.candidateList.innerHTML = candidateListTemplate({
      activeMugs
    });

    var schedule = getSchedule(lineup);
    var eventDate = scheduleInfo[lineup].eventDate;

    // template!
    elements.resultsHeader.innerHTML = headerTemplate({ activeMugs });
    elements.results.innerHTML = resultTemplate({
      activeMugs,
      schedule,
      stateRaces,
      eventDate
    });

    this.checkIfOverflow();

  }

  static get template() {
    return require("./_template.html");
  }

}

PresidentResultsMultiple.define("president-results-multiple");
