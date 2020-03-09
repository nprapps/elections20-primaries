require("../president-results");
require("./president-caucus.less");

var ElementBase = require("../elementBase");
var Retriever = require("../retriever");

var strings = require("strings.sheet.json");

var defaultRefresh = 15;

var mugs = require("mugs.sheet.json");
var defaultFold = Object.keys(mugs).filter(n => mugs[n].featured).sort();
var { mapToElements, toggleAttribute, groupBy } = require("../utils");


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

    races.sort((a, b) => a.party < b.party ? -1 : 1 );

    elements.chatter.innerHTML = chatter || "";
    elements.footnote.innerHTML = footnote || "";

    var href = this.getAttribute("href");
    var max = this.getAttribute("max");
    var party = this.getAttribute("party");
    var host = this.getAttribute("host");
    var isTest = !!this.cache.test;
    var caucusLabel = this.getAttribute("caucus") || this.cache.caucus;

    // merge races
    var byParty = groupBy(races, "party");

    var caucuses = races.filter(r => r.type == "Caucus");

    for (var p in byParty) {
      if (byParty[p].length == 1) continue;
      var partyRaces = races.filter(r => r.party == p);
      var merging = {};
      for (var r of partyRaces) {
        var result = r.results[0];
        result.candidates.forEach(function(c) {
          var candidate = merging[c.last] || {
            last: c.last,
            first: c.first,
            mugshot: mugs[c.last] ? mugs[c.last].src : "",
            votes: 0,
            percentage: 0
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
      // replace candidates
      var [caucus] = caucuses.filter(r => r.party == p);
      var replacement = Object.keys(merging).map(k => merging[k]);
      caucus.results[0].candidates = replacement;
      caucus.caucus = caucusLabel;
    }

    var pairs = mapToElements(elements.results, caucuses, "president-results");
    pairs.forEach(function([data, child]) {
      toggleAttribute(child, "hidden", party && data.party != party);
      toggleAttribute(child, "test", isTest);

      var readableParty = data.party == "Dem" ? "Democratic" : data.party;
      var contestType = data.caucus || data.type == "Caucus" ? "caucus" : "primary";
      var headline = `${strings[data.state + "-AP"]} ${readableParty} ${contestType}`;

      if (host == "statepage") {
        headline = `${readableParty} ${contestType}`;
        var search = new URLSearchParams("counties=true&office=P");
        search.set("date", data.date);
        search.set("party", data.party);
        href = "#" + search.toString();
        var { resultsLink } = child.illuminate();
        resultsLink.innerHTML = "See county results &rsaquo;";
      }

      if (href) child.setAttribute("href", href);
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

PresidentCaucus.define("president-caucus");
