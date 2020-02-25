var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
var $ = require("../../lib/qsa");
require("../results-table");
require("./county-detail.less");

var { formatAPDate, formatTime, groupBy, mapToElements, toggleAttribute } = require("../utils");

var fips = require("../../../../data/fips.sheet.json");

class CountyBlock extends ElementBase {
  static get template() {
    return `
<h4 data-as="county"></h4>
<div data-as="results"></div>
    `
  }
}
CountyBlock.define("county-block");

class CountyDetail extends ElementBase {

  constructor() {
    super();
    this.fetch = new Retriever(this.load);
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

    var party = this.getAttribute("party");

    var results = [].concat(...races.map(r => r.results));
    var counties = {};
    var fips = {};
    results.forEach(function(r) {
      counties[r.county] = r.fips;
      fips[r.fips] = r.county;
    });

    counties = Object.keys(counties).map(county => ({ county, id: counties[county] }));
    counties.unshift({ county: "All counties", id: 0 });
    mapToElements(elements.countySelect, counties, function(data) {
      var option = document.createElement("option");
      option.innerHTML = data.county;
      option.value = data.id;
      return option;
    });

    var groupedResults = groupBy(results, "fips");
    var countyResults = Object.keys(groupedResults).map(function(g) {
      return {
        id: g,
        results: groupedResults[g]
      }
    });

    var countyBlocks = mapToElements(elements.counties, countyResults, "county-block");
    countyBlocks.forEach(function([data, block]) {
      var { results, id } = data;
      var blockElements = block.illuminate();
      blockElements.county.innerHTML = fips[id];
      
      var pairs = mapToElements(blockElements.results, results, "results-table", "party");
      pairs.forEach(function([data, child]) {
        toggleAttribute(child, "hidden", party && party != data.party);
        child.setAttribute("max", 6);
        child.render(data);
      });
    });

  }

  static get template() {
    return require("./_template.html");
  }

  onSelectCounty() {
    var elements = this.illuminate();
    var fips = elements.countySelect.value;
    var blocks = $(`county-block`, this);
    blocks.forEach(function(block) {
      if (fips == 0) {
        block.removeAttribute("hidden");
      } else {
        toggleAttribute(block, "hidden", block.dataset.key != fips);
      }
    });
  }

  illuminate() {
    var elements = super.illuminate();
    elements.countySelect.addEventListener("change", this.onSelectCounty);
    return elements;
  }

}

CountyDetail.define("county-detail");