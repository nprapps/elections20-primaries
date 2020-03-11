var ElementBase = require("../elementBase");
var dot = require("../../lib/dot");
var key = dot.compile(require("./_key.html"));
require("./county-map.less");

class CountyMap extends ElementBase {

  constructor() {
    super();
    this.cache = null;
    this.selected = null;
    this.svg = null;
  }

  static get template() {
    return `
      <div class="container" data-as="container">
        <div class="key" data-as="key"></div>
        <div class="map" data-as="map"></div>
      </div>
    `;
  }

  static get boundMethods() {
    return ["onClick"];
  }

  static get observedAttributes() {
    return ["src"];
  }

  static get mirroredProps() {
    return ["src"]
  }

  attributeChangedCallback(attr, was, value) {
    switch(attr) {
      case "src":
        this.loadSVG(value);
        break;
    }
  }

  highlightCounty(fips) {
    if (!this.svg) return;
    var county = this.svg.querySelector(`[id="fips-${fips}"]`);
    if (county == this.lastClicked) return;
    if (this.lastClicked) this.lastClicked.classList.remove("clicked");
    county.parentElement.appendChild(county);
    county.classList.add("clicked");
    this.lastClicked = county;
  }

  async loadSVG(url) {
    console.log(`Loading map from ${url}...`);

    var elements = this.illuminate();
    var response = await fetch(url);
    var content = await response.text();
    elements.map.innerHTML = content;

    var svg = elements.map.querySelector("svg");
    svg.setAttribute("preserveAspectRatio","xMaxYMid meet");

    var paths = elements.map.querySelectorAll("path");
    paths.forEach(p => p.setAttribute("vector-effect","non-scaling-stroke"));

    var width = svg.getAttribute("width") * 1;
    var height = svg.getAttribute("height") * 1;
    // elements.aspect.style.paddingBottom = height / width * 100 + "%";
    elements.container.classList.toggle("horizontal", width < height);

    this.svg = svg;
    this.svg.addEventListener("click", this.onClick);

    this.paint();
  }

  render(palette, results) {
    this.cache = { palette, results };
    this.paint();
  }

  paint() {
    var elements = this.illuminate();

    if (!this.cache || !this.svg) return;
    var { palette, results } = this.cache;

    var maxPop = 0;
    results.forEach(function(r) { 
      if (r.population > maxPop) maxPop = r.population;
    })

    var lookup = {};
    for (var r of results) {
      var { fips, candidates } = r;
      var [top] = candidates.sort((a, b) => b.percentage - a.percentage);
      if (!top.votes) continue;
      var [winner] = candidates.filter(c => c.winner);
      var path = this.svg.querySelector(`[id="fips-${fips}"]`);
      var pigment = palette[winner ? winner.id : top.id];
      path.style.fill = pigment ? pigment.color : "#787878";

      var popPerc = r.population / maxPop;
      var opacity = popPerc > 0.5 ? 1    :
                    popPerc > 0.2 ? 0.75 :
                    popPerc > 0.1 ? 0.5  :
                                    0.25 ;
      path.style["fill-opacity"] = opacity;
    }

    var keyData = Object.keys(palette).map(p => palette[p]).sort((a,b) => a.order < b.order ? -1 : 1);
    elements.key.innerHTML = key({ keyData });
  }

  onClick(e) {
    var county = e.target;
    var fips = county.id.replace("fips-", "");
    
    if (fips.length > 0) {
      this.dispatch("map-click", { fips });
      this.highlightCounty(fips);
    }
  }

}

CountyMap.define("county-map");