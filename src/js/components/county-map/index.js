var ElementBase = require("../elementBase");

var stylesheet = `
.container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.container.vertical {
  flex-direction: column;
}

.map {
  // flex: 1;
}

svg {
  width: 100%;
  max-height: 50vh;
}

path {
  stroke: gray;
  fill: transparent;
}

path:hover {
  cursor: pointer;
  stroke-width: 6;
  stroke: #111;
}

path.clicked {
  stroke-width: 9;
  stroke: #111;
}
`;

class CountyMap extends ElementBase {

  constructor() {
    super();
    this.cache = null;
    this.selected = null;
    this.svg = null;

    this.attachShadow({ mode: "open" });

    this.container = document.createElement("div");
    this.container.className = "container";
    this.shadowRoot.appendChild(this.container);

    this.key = document.createElement("ul");
    this.key.className = "key";
    this.container.appendChild(this.key);

    this.map = document.createElement("div");
    this.map.className = "map";
    this.container.appendChild(this.map);
    this.map.addEventListener("click", this.onClick);


    var style = document.createElement("style");
    style.innerHTML = stylesheet;
    this.shadowRoot.appendChild(style);
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
    var county = this.svg.querySelector(`[id="fips-${fips}"]`);
    if (county == this.lastClicked) return;
    if (this.lastClicked) this.lastClicked.classList.remove("clicked");
    county.classList.add("clicked");
    this.lastClicked = county;
  }

  async loadSVG(url) {
    console.log(`Loading map from ${url}...`);
    var response = await fetch(url);
    var content = await response.text();
    this.map.innerHTML = content;
    var svg = this.map.querySelector("svg");
    var width = svg.getAttribute("width") * 1;
    var height = svg.getAttribute("height") * 1;
    this.container.classList.toggle("vertical", width > height);
    this.svg = svg;
    this.key.innerHTML = "KEY CONTENT HERE";
    this.paint();
  }

  render(palette, results) {
    this.cache = { palette, results };
    this.paint();
  }

  paint() {
    if (!this.cache || !this.svg) return;
    var { palette, results } = this.cache;

    var lookup = {};
    for (var r of results) {
      var { fips, candidates } = r;
      var [top] = candidates.sort((a, b) => b.percentage - a.percentage);
      if (!top.votes) continue;
      var [winner] = candidates.filter(c => c.winner);
      var path = this.svg.querySelector(`[id="fips-${fips}"]`);
      var pigment = palette[winner ? winner.id : top.id];
      path.style.fill = pigment ? pigment.color : "#888";
      path.style.opacity = winner ? 1 : .5;
    }
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