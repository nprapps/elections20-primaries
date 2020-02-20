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

  matchElements(root, array, createElement) {
    var children = Array.from(root.children);
    var binding = new Map();
    array.forEach(function(item) {
      var [child] = children.filter(c => c.dataset.key == item.id);
      if (!child) {
        // create a node and append it
        child = createElement(item);
        child.dataset.key = "item-" + item.id;
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
    // sort to match
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

    // assume one race per seat for governor
    var race = this.cache.races[0];
    var createResult = () => document.createElement("results-table");
    // create result tables
    var pairs = this.matchElements(elements.results, race.results, createResult);

    // render each one
    var party = this.getAttribute("party");
    var test = this.cache.test;
    pairs.forEach(function([data, child]) {
      if (party && data.party != party) {
        child.setAttribute("hidden", "");
      } else {
        child.removeAttribute("hidden");
      }
      if (href) child.setAttribute("href", href);
      if (max) child.setAttribute("max", max);
      if (test) {
        child.setAttribute("test", "");
      }
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

GovernorPrimary.define("governor-primary");
