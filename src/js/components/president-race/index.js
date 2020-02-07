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
    return ["src"];
  }

  attributeChangedCallback(attr, old, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value, this.getAttribute("refresh") || 15);
        break;
    }
  }

  load(data) {
    var { races } = data;
    // filter on party
    if (this.hasAttribute("party")) {
      var party = this.getAttribute("party");
      races = races.filter(r => r.party == party);
    }
    var children = Array.from(this.children);
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
        this.removeChild(child);
      }
    });
    // if there are leftover races, create them
    races.forEach(r => {
      var child = document.createElement("president-results");
      this.appendChild(child);
      child.dataset.race = r.id;
      if (this.hasAttribute("max")) child.setAttribute("max", this.getAttribute("max"));
      child.race = r;
      children.push(child);
    });
    // set the test flag
    if (data.test) {
      children.forEach(c => c.setAttribute("test", ""));
    } else {
      children.forEach(c => c.removeAttribute("test"));
    }
  }
}

PresidentPrimary.define("president-primary");
