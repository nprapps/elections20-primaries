var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("../results-table");
require("./governor-primary.less");

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

  // sort of like d3.data but for data -> elements
  mapToElements(root, array, element = "div") {

    var children = Array.from(root.children);
    var binding = new Map();

    array.forEach(function(item) {
      var [child] = children.filter(c => c.dataset.key == item.id);
      if (!child) {
        // create a node and append it
        child = typeof element == "function" ? element(item) : document.createElement(element);
        child.dataset.key = item.id;
        children.push(child);
        root.appendChild(child);
      }
      binding.set(child, item);
      binding.set(item, child);
    });

    // remove deleted children
    children.forEach(function(child) {
      if (!binding.has(child)) {
        root.removeChild(child);
      }
    });

    // sort children to match array order
    children = Array.from(root.children);
    var pairs = array.map(function(item, i) {
      var child = binding.get(item);
      var childIndex = children.indexOf(child);
      if (childIndex != i) {
        var next = children[i + 1];
        if (next) {
          root.insertBefore(child, next);
        } else {
          root.appendChild(child);
        }
      }
      return [item, child];
    });
    return pairs;
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

    var races = this.mapToElements(elements.results, this.cache.races, "div");
    races.forEach(([race, element]) => {
      element.className = "race";

      if (party && race.party != party) {
        element.setAttribute("hidden", "");
      } else {
        element.removeAttribute("hidden");
      }
      // create result tables
      var pairs = this.mapToElements(element, race.results, "results-table");

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
    })
    
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
