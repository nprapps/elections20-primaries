var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./president-results");

class PresidentPrimary extends ElementBase {
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
    }
  }

  load(data) {
    var elements = this.illuminate();

    var { races, chatter, footnote } = data;

    elements.chatter.innerHTML = chatter;
    elements.footnote.innerHTML = footnote;
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
        child.race = matched;
      } else {
        elements.results.removeChild(child);
      }
    });
    // if there are leftover races, create them
    races.forEach(r => {
      var child = document.createElement("president-results");
      elements.results.appendChild(child);
      child.dataset.race = r.id;
      if (this.hasAttribute("href")) child.setAttribute("href", this.getAttribute("href"));
      if (this.hasAttribute("max")) child.setAttribute("max", this.getAttribute("max"));
      child.render(r);
      children.push(child);
    });
    // set the test flag
    if (data.test) {
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

PresidentPrimary.define("president-primary");
