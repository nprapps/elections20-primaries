require("../president-results");

var ElementBase = require("../elementBase");
var Retriever = require("../retriever");

var defaultRefresh = 15;

var mugs = require("../../../../data/mugs.sheet.json");
var defaultFold = Object.keys(mugs).filter(n => mugs[n].featured).sort();
var { mapToElements, toggleAttribute } = require("../utils");


class PresidentCaucus extends ElementBase {
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
    var isTest = !!this.cache.test;
    var caucusLabel = this.getAttribute("caucus") || "";

    // merge races
    var merged = {};
    for (var r of races) {
      if (!merged[r.party]) {
        merged[r.party] = {};
      }
      var merging = merged[r.party];
      var result = r.results[0];
      result.candidates.forEach(function(c) {
        var candidate = merging[c.last] || {
          last: c.last,
          first: c.first,
          mugshot: mugs[c.last] ? mugs[c.last].src : ""
        };
        if (r.type == "Caucus") {
          // assign votes
          candidate.caucus = c.votes;
          candidate.percentage = c.percentage || 0;
          candidate.winner = c.winner;
        } else {
          // assign winner, percentage, and caucus delegates
          candidate.votes = c.votes;
        }
        merging[c.last] = candidate;
      });
    }

    var caucuses = races.filter(r => r.type == "Caucus");

    var pairs = mapToElements(elements.results, caucuses, "president-results");
    pairs.forEach(function([data, child]) {
      toggleAttribute(child, "hidden", party && data.party != party);
      toggleAttribute(child, "test", isTest);
      if (href) child.setAttribute("href", href);
      if (max) child.setAttribute("max", max);
      var candidates = Object.keys(merged[data.party]).map(k => merged[data.party][k]);
      var replacedResults = Object.assign({}, data.results[0], { candidates });
      var mergedData = Object.assign({}, data, { caucus: caucusLabel, results: [replacedResults] });
      child.render(mergedData);
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

PresidentCaucus.define("president-caucus");
