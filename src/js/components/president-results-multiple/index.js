var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./president-results-multiple.less");

var dot = require("../../lib/dot");
var tableTemplate = dot.compile(require("./_table.html"));

var { formatTime, formatAPDate } = require("../utils");

var mugs = require("../../../../data/mugs.sheet.json");
// var defaultFold = Object.keys(mugs).filter(n => mugs[n].featured).sort();
// var defaultMax = 6;

class PresidentResultsMultiple extends ElementBase {

  constructor() {
    super();
    // this is a place to keep local state
    // for example, we might make a variable for pagination
    this.page = 0;
    // we will also create a retriever for data
    this.fetch = new Retriever(this.load);
  }

  // bound methods will always have the correct `this` value
  static get boundMethods() {
    return [
      "load",
      "shiftResultsNext",
      "shiftResultsPrevious"
    ]
  }

  shiftResultsNext(e) {
    console.log("next", e);
  }

  shiftResultsPrevious(e) {
    console.log("previous", e);
  }

  connectedCallback() {
    // we can illuminate in connected to template
    // but we'll more likely call it when we get data in load();
    this.illuminate();
  }

  // attributes will only trigger the callback if they're observed
  static get observedAttributes() {
    return ["src"];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.fetch.watch(value);
        break;
    }
  }

  illuminate() {
    // call the inherited illuminate function
    var elements = super.illuminate();
    // add event listeners (this will only run once)
    elements.nextButton.addEventListener("click", this.shiftResultsNext);
    elements.backButton.addEventListener("click", this.shiftResultsPrevious);
    return elements;
  }

  load(data) {
    console.log(data);
    // now we can run templating here, as well as update static elements from illuminate
    var elements = this.illuminate();
    console.log(elements);
    elements.updated.innerHTML = "UPDATED";
  }

  static get template() {
    return require("./_template.html");
  }

}

PresidentResultsMultiple.define("president-results-multiple");
