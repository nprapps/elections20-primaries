var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("../results-table");
require("./standard-primary.less");
var { mapToElements, toggleAttribute } = require("../utils");

var strings = require("strings.sheet.json");

class StandardPrimary extends ElementBase {
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
    
    races.sort((a, b) => a.party < b.party ? -1 : 1 );

    elements.chatter.innerHTML = chatter || "";
    elements.footnote.innerHTML = footnote || "";

    var href = this.getAttribute("href");
    var max = this.getAttribute("max");
    var party = this.getAttribute("party");
    var host = this.getAttribute("host");

    var races = mapToElements(elements.results, this.cache.races);
    races.forEach(([race, element]) => {
      element.className = "race";

      toggleAttribute(element, "hidden", party && race.party != party);
      // create result tables
      var pairs = mapToElements(element, race.results, "results-table");

      // render each one
      var test = !!this.cache.test;
      pairs.forEach(function([data, child]) {

        var readableParty = data.party == "Dem" ? "Democratic" : data.party;
        var headline = `${strings[race.state + "-AP"]} ${readableParty} primary`;

        if (host == "statepage") {
          headline = `${readableParty} primary`;
          var search = new URLSearchParams("counties=true");
          search.set("date", race.date);
          search.set("party", race.party);
          search.set("office", race.office)
          href = "#" + search.toString();

          var { resultsLink } = child.illuminate();
          resultsLink.innerHTML = "See county results &rsaquo;";
        }

        if (href) child.setAttribute("href", href);
        if (max) child.setAttribute("max", max);
        toggleAttribute(child, "test", test);

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

StandardPrimary.define("standard-primary");
