var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./president-results-multiple.less");

var dot = require("../../lib/dot");
var candidateListTemplate = dot.compile(require("./_candidate_list.html"));
var resultTemplate = dot.compile(require("./_result.html"));

var { formatTime, formatAPDate } = require("../utils");

var mugs = require("../../../../data/mugs.sheet.json");

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
      "shiftResultsNext",
      "shiftResultsPrevious",
      "checkIfOverflow"
    ]
  }

  shiftResultsNext(e) {
    // console.log("next", e);
    var elements = this.illuminate();
    var resultLeft = elements.results.offsetLeft;
    var resultWidth = elements.results.offsetWidth;
    var resultWrapperWidth = elements.resultsWrapper.offsetWidth;
    var shiftIncrement = resultWrapperWidth - 50;

    // shift only if there's still something to see on the next "page"
    if ((resultWidth + resultLeft - shiftIncrement) > 10) {
      elements.results.style.left = (resultLeft - shiftIncrement) + 'px';
    } else {
      return;
    }
  }

  shiftResultsPrevious(e) {
    // console.log("previous", e);
    var elements = this.illuminate();
    var resultLeft = elements.results.offsetLeft;
    var resultWidth = elements.results.offsetWidth;
    var resultWrapperWidth = elements.resultsWrapper.offsetWidth;
    var shiftIncrement = resultWrapperWidth - 50;

    // shift only if there's still something to see on the previous "page"
    if (resultLeft == 0) {
      return;
    } else if ((resultLeft + shiftIncrement) < 0) {
      elements.results.style.left = (resultLeft + shiftIncrement) + 'px';
    } else {
      elements.results.style.left = '0px';
    }
  }

  checkIfOverflow() {
    // show/hide pagination if necessary
    var elements = this.illuminate();
    var resultWidth = elements.results.offsetWidth;
    var resultWrapperWidth = elements.resultsWrapper.offsetWidth;
    if (resultWrapperWidth < resultWidth) {
      this.setAttribute("overflow", "");
      console.log("overflow");
    } else {
      this.removeAttribute("overflow");
      console.log("no overflow");
    }
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
    elements.nextButton.addEventListener("click", this.shiftResultsNext);
    elements.backButton.addEventListener("click", this.shiftResultsPrevious);
    window.addEventListener("resize", this.checkIfOverflow);
    return elements;
  }

  load(data) {
    this.toggleAttribute("test", !!data.test);

    var party = this.getAttribute("party");

    // filter mugs to active candidates from the active party
    var activeMugs = [];
    for (const cand in mugs) {
      if (mugs[cand].party == party && mugs[cand].active) {
        activeMugs[cand] = mugs[cand];
      }
    }

    // filter to democratic races only
    var racesShown = data.races.filter(function(d) {
      return d.party == party;
    });

    // now we can run templating here, as well as update static elements from illuminate
    var elements = this.illuminate();
    console.log(elements);

    elements.updated.innerHTML = "UPDATED"; // TODO: FIGURE OUT MOST RECENT UPDATE TIME FROM THIS BATCH OF RESULTS

    elements.candidateList.innerHTML = candidateListTemplate({
      activeMugs
    });
    racesShown.forEach(function(race) {
      var s = race.state;
      var results = race.results[0];

      elements[s].querySelector(".result-info").innerHTML = resultTemplate({
        activeMugs,
        results
      })
    })

  }

  static get template() {
    return require("./_template.html");
  }

}

PresidentResultsMultiple.define("president-results-multiple");
