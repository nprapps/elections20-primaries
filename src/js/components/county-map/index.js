var ElementBase = require("../elementBase");
var dot = require("../../lib/dot");
var key = dot.compile(require("./_key.html"));
require("./county-map.less");

var specialStates = new Set(['IA', 'MA', 'OK', 'WA']);

class CountyMap extends ElementBase {
  constructor() {
    super();
    this.cache = null;
    this.selected = null;
    this.svg = null;
    this.fipsLookup = {};
  }

  static get template() {
    return `
      <div class="container" data-as="container">
        <svg class="patterns" style="opacity: 0; position: absolute; left: -1000px">
          <pattern id="pending"
            width="10" height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <path
              d="M5,0L5,10"
              stroke="rgba(0, 0, 0, .2)"
              stroke-width="4"
            ></path>
          </pattern>
        </svg>
        <div class="key" data-as="key"></div>
        <div class="map-container" data-as="mapContainer">
          <div class="map" data-as="map"></div>
          <div class="tooltip" data-as="tooltip"></div>
        </div>
      </div>
    `;
  }

  static get boundMethods() {
    return ["onClick", "onMove"];
  }

  static get observedAttributes() {
    return ["src"];
  }

  static get mirroredProps() {
    return ["src"];
  }

  attributeChangedCallback(attr, was, value) {
    switch (attr) {
      case "src":
        this.loadSVG(value);
        break;
    }
  }

  illuminate() {
    var elements = super.illuminate();
    elements.map.addEventListener("click", this.onClick);
    elements.map.addEventListener("mousemove", this.onMove);
    elements.map.addEventListener("mouseleave", this.onMove);
    return elements;
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
    svg.setAttribute("preserveAspectRatio", "xMaxYMid meet");

    var paths = elements.map.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    //   p.style.transitionDuration = (Math.random() * 2).toFixed(2) + "s";
    });

    var width = svg.getAttribute("width") * 1;
    var height = svg.getAttribute("height") * 1;
    if (width > height * 1.4) {
      var ratio = height / width;
      elements.mapContainer.style.width = "100%";
      elements.mapContainer.style.paddingBottom = `${100 * ratio}%`;
    } else {
      var ratio = width / height;
      var basis = height > width * 1.1 ? 65 : 55;
      elements.mapContainer.style.height = basis + "vh";
      elements.mapContainer.style.width = `${basis * ratio}vh`;
    }
    // elements.aspect.style.paddingBottom = height / width * 100 + "%";
    elements.container.classList.toggle("horizontal", width < height);

    this.svg = svg;

    this.paint();
  }

  render(palette, results, state) {
    this.cache = { palette, results, state };
    this.paint();
  }

  paint() {
    var elements = this.illuminate();

    if (!this.cache || !this.svg) return;
    var { palette, results, state } = this.cache;
    var incomplete = false;

    this.classList.toggle("chonky", specialStates.has(state));

    var winners = new Set();
    var hasVotes = false;
    results.forEach(r => {
      var [top] = r.candidates.sort((a, b) => b.percentage - a.percentage);
      if (top.votes) {
        winners.add(top.id in palette ? top.id : "other");
        hasVotes = true;
      }
      this.fipsLookup[r.fips] = r;
    });

    var lookup = {};
    for (var r of results) {
      var { fips, candidates } = r;
      var [top] = candidates.sort((a, b) => b.percentage - a.percentage);
      if (!top.votes) continue;

      var path = this.svg.querySelector(`[id="fips-${fips}"]`);
      path.classList.add("painted");
      var pigment = palette[top.id];
      var hitThreshold = r.reportingPercentage > 25;
      var paint = "#bbb";
      if (hitThreshold) {
        paint = pigment ? pigment.color : "#bbb"
      } else {
        paint = `url(#pending)`;
        incomplete = true;
      }

      path.style.fill = paint;
    }

    if (hasVotes) {
      var pKeys = Object.keys(palette);
      var keyData = pKeys
        .map(p => palette[p])
        .sort((a, b) => (a.order < b.order ? -1 : 1));
      var filtered = keyData.filter(p => winners.has(p.id));
      keyData = filtered.length < 2 ? keyData.slice(0, 2) : filtered;
      elements.key.innerHTML = key({ keyData, incomplete });
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

  onMove(e) {
    var { tooltip, map } = this.illuminate();
    var fips = e.target.id.replace("fips-", "");
    if (!fips || e.type == "mouseleave") {
      return tooltip.classList.remove("shown");
    }

    var result = this.fipsLookup[fips];
    if (result) {
      var candText = "";
      if (result.reportingPercentage > 25) {
        var leadingCandidate = result.candidates[0];
        var prefix = leadingCandidate.winner ? "Winner: " : "Leading: ";
        var candText = prefix + leadingCandidate.last + " (" + leadingCandidate.percentage.toFixed(1) + "%)";
      }

      var countyDisplay = result.county.replace(/\s[a-z]/g, match =>
        match.toUpperCase()
      );
      tooltip.innerHTML = `
        <div class="name">${countyDisplay}</div>
        <div class="pop">Pop. ${result.population.toLocaleString()}</div>
        <div class="result">${ candText }</div>
        <div class="reporting">${result.reportingPercentage.toFixed(1)}% reporting</div>
      `;
    }

    var bounds = map.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= tooltip.offsetWidth + 10;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }
}

CountyMap.define("county-map");
