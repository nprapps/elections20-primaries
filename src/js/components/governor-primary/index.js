var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("../results-table");
require("./governor-primary.less");
var { mapToElements } = require("../utils");

class GovernorPrimary extends ElementBase {
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
        if (typeof value != "string") {
          this.fetch.stop();
        } else {
          this.fetch.start(this.getAttribute("live") || 15);
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

    var races = mapToElements(elements.results, this.cache.races, "div");
    races.forEach(([race, element]) => {
      element.className = "race";

      if (party && race.party != party) {
        element.setAttribute("hidden", "");
      } else {
        element.removeAttribute("hidden");
      }
      // create result tables
      var pairs = mapToElements(element, race.results, "results-table");

      // render each one
      var test = this.cache.test;
      pairs.forEach(function([data, child]) {
        if (href) child.setAttribute("href", href);
        if (max) child.setAttribute("max", max);
        if (test) {
          child.setAttribute("test", "");
        }
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

GovernorPrimary.define("governor-primary");
