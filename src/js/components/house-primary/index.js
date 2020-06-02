var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("../results-table");
require("./house-primary.less");
var { mapToElements, toggleAttribute, groupBy } = require("../utils");

var strings = require("strings.sheet.json");

class HouseSeat extends ElementBase {
  static get template() {
    return `
      <h4 data-as="seat"></h4>
      <div data-as="results"></div>
    `;
  }
}

HouseSeat.define("house-seat");

class HousePrimary extends ElementBase {
  constructor() {
    super();
    this.fetch = new Retriever(this.load);
  }

  static get boundMethods() {
    return ["load"];
  }

  static get observedAttributes() {
    return ["src", "href", "live", "party"];
  }

  static get mirroredProps() {
    return ["src", "href"]
  }

  attributeChangedCallback(attr, old, value) {
    switch (attr) {
      case "src":
        if (this.hasAttribute("live")) {
          this.fetch.watch(value, this.getAttribute("live") || 15);
        } else {
          this.fetch.once(value);
        }
        break;

      case "live":
        if (typeof value == "string") {
          this.fetch.start(value || 15);
        } else {
          this.fetch.stop();
        }
        break;

      default:
        this.render();
    }
  }

  load(data) {
    this.cache = data;
    this.render();
  }

  render() {
    var elements = this.illuminate();

    if (!this.cache) return;
    var { races, chatter, footnote } = this.cache;

    elements.chatter.innerHTML = chatter || "";
    elements.footnote.innerHTML = footnote || "";

    var href = this.getAttribute("href");
    var max = this.getAttribute("max");
    var party = this.getAttribute("party");
    var host = this.getAttribute("host");
    var district = this.getAttribute("district");

    var groupedResults = groupBy(this.cache.races, "seat");
    var seats = Object.keys(groupedResults).map(function(id) {
      return {
        results: groupedResults[id].map(r => r.results[0]),
        id,
        state: groupedResults[id][0].state
      }
    });

    var races = mapToElements(elements.results, seats, "house-seat");

    races.forEach(([race, element]) => {

      var seatElements = element.illuminate();

      var d = !race.id || race.id == "undefined" ? "(at-large)" : race.id;

      seatElements.seat.innerHTML = `District ${d}`;

      toggleAttribute(element, "hidden", district && race.id != district);

      element.dataset.count = race.results.length;

      race.results.sort((a, b) => a.party < b.party ? -1 : 1);

      // create result tables
      var pairs = mapToElements(seatElements.results, race.results, "results-table");

      // render each one
      var test = !!this.cache.test;

      pairs.forEach(function([data, child]) {
        if (href) child.setAttribute("href", href);
        child.setAttribute("max", 99);
        toggleAttribute(child, "test", test);

        toggleAttribute(child, "hidden", party && data.party != party);
        
        var readableParty = data.party == "Dem" ? "Democratic" : (data.party || "Open");
        var headline = `${strings[race.state + "-AP"]} ${readableParty} primary`;

        if (host == "statepage") {
          headline = `${readableParty} primary`;
        }

        child.setAttribute("headline", headline);
        child.render(data);
      });
    });
  }

  static get template() {
    return `
<div class="chatter" data-as="chatter"></div>
<div class="results" data-as="results"></div>
<p class="footnote" data-as="footnote"></p>
    `;
  }
}

HousePrimary.define("house-primary");
