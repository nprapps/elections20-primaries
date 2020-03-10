var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("../president-results");
require("./president-primary.less");
var { mapToElements, toggleAttribute } = require("../utils");

var strings = require("strings.sheet.json");

class PresidentPrimary extends ElementBase {
  constructor() {
    super();
    this.fetch = new Retriever(this.load);
  }

  static get boundMethods() {
    return ["load"];
  }

  static get mirroredProps() {
    return ["src", "href"]
  }

  static get observedAttributes() {
    return ["src", "href", "live", "party"];
  }

  attributeChangedCallback(attr, old, value) {

    switch (attr) {
      case "src":
        if (this.hasAttribute("live")) {
          this.fetch.watch(value, this.getAttribute("refresh") || 15);
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
    var isTest = !!this.cache.test;

    races.sort((a, b) => a.party < b.party ? -1 : 1 );

    var pairs = mapToElements(elements.results, races, "president-results");
    pairs.forEach(function([data, child]) {
      toggleAttribute(child, "hidden", party && data.party != party);
      toggleAttribute(child, "test", isTest);
      
      var partyText = data.party == "Dem" ? "Democratic" : data.party;
      var headline = `${strings[data.state + "-AP"]} ${partyText} primary`;

      if (host == "statepage" && href != "false") {
        headline = `${partyText} primary`;
        // update the link
        var search = new URLSearchParams("counties=true&office=P");
        search.set("date", data.date);
        search.set("party", data.party);
        href = "#" + search.toString();
        var { resultsLink } = child.illuminate();
        resultsLink.innerHTML = "See county results &rsaquo;";
      }

      if (href && href != "false") child.setAttribute("href", href);
      if (max) child.setAttribute("max", max);
      child.setAttribute("headline", headline);
      child.render(data);
    });
  }

  static get template() {
    return `
<div class="chatter" data-as="chatter"></div>
<div class="results" data-as="results"></div>
<p class="footnote" data-as="footnote"></p>
    `
  }
}

PresidentPrimary.define("president-primary");
