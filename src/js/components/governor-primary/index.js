var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./governor-results");

class GovernorPrimary extends ElementBase {
  constructor() {
    super();
    this.fetch = new Retriever(this.load);
  }

  static get boundMethods() {
    return ["load"];
  }

  static get observedAttributes() {
    return ["src", "href", "live"];
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
        if (typeof value != "string") {
          this.fetch.stop();
        } else {
          this.fetch.start(this.getAttribute("refresh") || 15);
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

    elements.chatter.innerHTML = chatter;
    elements.footnote.innerHTML = footnote;

    var href = this.getAttribute("href");
    var max = this.getAttribute("max");
      
    // filter on party
    if (this.hasAttribute("party")) {
      var party = this.getAttribute("party");
      races = races.filter(r => r.party == party);
    }
    var children = Array.from(elements.results.children);
    // handle existing children
    children.forEach(child => {
      // get a matching race
      var matched = null;
      races = races.filter(r => {
        if ((child.dataset.race == r.id)) {
          matched = r;
          return false;
        }
        return true;
      });

      // either set results or remove the child
      if (matched) {
        if (href) child.setAttribute("href", href);
        if (max) child.setAttribute("max", max);
        child.render(matched);
      } else {
        elements.results.removeChild(child);
      }
    });
    // if there are leftover races, create them
    races.forEach(r => {
      var child = document.createElement("governor-results");
      elements.results.appendChild(child);
      child.dataset.race = r.id;
      if (href) child.setAttribute("href", href);
      if (max) child.setAttribute("max", max);
      child.render(r);
      children.push(child);
    });
    // set the test flag
    if (this.cache.test) {
      children.forEach(c => c.setAttribute("test", ""));
    } else {
      children.forEach(c => c.removeAttribute("test"));
    }
  }

  static get template() {
    return `
<div class="chatter" data-as="chatter"></div>
<div class="results" data-as="results"></div>
<p class="footnote" data-as="footnote"></p>
    `
  }
}

GovernorPrimary.define("governor-primary");
