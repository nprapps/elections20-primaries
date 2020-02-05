var ElementBase = require("../elementBase");
require("./president-results");

class PresidentPrimary extends ElementBase {
  constructor() {
    super();
    this.etag = null;
    this.timeout = null;
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
        this.load(value);
        break;
    }
  }

  async load(src = this.getAttribute("src")) {
    if (this.hasAttribute("live")) this.scheduleRefresh();
    var response = await fetch(src, {
      headers: {
        "If-None-Match": this.etag
      }
    });
    if (response.status >= 400) return (this.innerHTML = "No data");
    if (response.status == 304) return console.log(`No change for ${src}`);
    var data = await response.json();
    var { races } = data;
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
        console.log(child, matched);
        child.race = matched;
      } else {
        this.removeChild(child);
      }
    });
    // if there are leftover races, create them
    races.forEach(r => {
      var child = document.createElement("president-results");
      this.appendChild(child);
      child.race = r;
      child.dataset.race = r.id;
      children.push(child);
    });
    // set the test flag
    if (data.test) {
      children.forEach(c => c.setAttribute("test", ""));
    } else {
      children.forEach(c => c.removeAttribute("test"));
    }
  }

  scheduleRefresh() {
    if (this.timeout) clearTimeout(this.clearTimeout);
    var interval = this.hasAttribute("refresh")
      ? this.getAttribute("refresh") * 1
      : 15;
    this.timeout = setTimeout(this.load, interval * 1000);
  }
}

PresidentPrimary.define("president-primary");
