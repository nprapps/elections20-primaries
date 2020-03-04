var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
var $ = require("../../lib/qsa");
var track = require("../../lib/tracking");
require("../results-table");
require("./county-detail.less");

var { formatAPDate, formatTime, groupBy, mapToElements, toggleAttribute } = require("../utils");

class CountyDetail extends ElementBase {

  constructor() {
    super();
    this.fetch = new Retriever(this.load);
    this.palette = {};
  }

  static get boundMethods() {
    return ["load", "onSelectCounty"];
  }

  static get observedAttributes() {
    return ["src", "party", "live"];
  }

  static get mirroredProps() {
    return ["src"];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value, this.getAttribute("live") || 60);
        break;

      case "party":
        this.render();
        break;

      case "live":
        if (typeof value == "string") {
          this.fetch.start(value);
        } else {
          this.fetch.stop();
        }
    }
  }

  load(data) {
    this.cache = data;
    this.render();
  }

  render() {
    var elements = this.illuminate();
    var data = this.cache;
    if (!data) return;
    var { races, test } = data;

    // filter races by type - no weird alignments
    races = races.filter(r => r.type && !r.type.match(/alignment/i));

    var party = this.getAttribute("party");

    var results = [].concat(...races.map(r => r.results));
    var counties = {};
    var fips = {};
    var totals = {}; // by candidate ID
    results.forEach(function(r) {
      var top = null;
      r.candidates.forEach(function(candidate) {
        if (!totals[candidate.id]) totals[candidate.id] = {
          first: candidate.first,
          last: candidate.last,
          id: candidate.id,
          votes: 0
        };
        totals[candidate.id].votes += candidate.votes;
        if (!top || candidate.percentage > top.percentage) {
          top = candidate;
        }
        delete candidate.winner;
      });
      if (r.reportingPercentage == 100) {
        top.winner = true;
      }
      counties[r.county] = r.fips;
      fips[r.fips] = r.county;
    });

    // for future map use: determine the palette by statewide total position
    var statewide = Object.values(totals);
    statewide.sort((a, b) => b.votes - a.votes);

    counties = Object.keys(counties).sort().map(county => ({ county, id: counties[county] }));
    // counties.unshift({ county: "--", id: 0 });
    mapToElements(elements.countySelect, counties, function(data) {
      var option = document.createElement("option");
      option.innerHTML = data.county.replace(/\s[a-z]/g, match => match.toUpperCase());
      option.value = data.id;
      return option;
    });

    var value = elements.countySelect.value;
    this.updateTable(value);
  }

  updateTable(fips) {
    if (fips == 0) return;
    var elements = this.illuminate();
    var { resultsTable } = elements;
    var data = this.cache;
    var party = this.getAttribute("party");
    if (!data || !party) return;

    var { races } = data;
    var [ race ] = races.filter(r => r.party == party);
    var [ result ] = race.results.filter(r => r.fips == fips);

    resultsTable.setAttribute("headline", result.county);
    resultsTable.setAttribute("max", 99);
    if (result) resultsTable.render(result);
  }

  static get template() {
    return require("./_template.html");
  }

  onSelectCounty() {
    var elements = this.illuminate();
    var fips = elements.countySelect.value;
    track("select-county", fips);
    this.updateTable(fips);
  }

  illuminate() {
    var elements = super.illuminate();
    elements.countySelect.addEventListener("change", this.onSelectCounty);
    return elements;
  }

}

CountyDetail.define("county-detail");