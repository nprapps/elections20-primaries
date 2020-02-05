var ElementBase = require("../elementBase");
require("./president-results")

class PresidentPrimary extends ElementBase {
  constructor() {
    super();
    this.etag = null;
    this.timeout = null;
  }

  static get observedAttributes() {
    return ["src"];
  }

  attributeChangedCallback(attr, old, value) {
    switch (attr) {
      case "src":
        this.load(value);
        break;
    }
  }

  async load(src = this.getAttribute("src")) {
    var response = await fetch(src, {
      headers: {
        "If-None-Match": this.etag
      }
    });
    if (response.status >= 400) return this.innerHTML = "No data";
    if (response.status == 304) return console.log(`No change for ${src}`);
    var data = await response.json();
    var { races } = data;
    var children = Array.from(this.children);
    // handle existing children
    children.forEach(function(child) {
      // get a matching race
      var matched = null;
      races = races.filter(function(r) {
        if (child.dataset.race = r.id) {
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
    races.forEach( r => {
      var child = document.createElement("president-results");
      this.appendChild(child);
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