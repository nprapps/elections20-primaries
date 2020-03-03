var ElementBase = require("../elementBase");
var Retriever = require("../retriever");
require("./liveblog-headlines.less");
var dot = require("../../lib/dot");
var template = dot.compile(require("./_template.html"));
var $ = require("../../lib/qsa");

var { formatTime, formatAPDate } = require("../utils");

var defaultRefresh = 60;

var ago = {
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7
};

var relativeTime = function(timestamp) {
  var now = Date.now();
  var delta = now - timestamp;
  if (delta > ago.week) {
    return formatAPDate(new Date(timestamp));
  }
  var pluralize = (word, count) => count == 1 ? word : word + "s";
  for (var d of ["week", "day", "hour", "minute",]) {
    var duration = ago[d];
    if (delta > duration) {
      var count = (delta / duration) | 0;
      return [count, pluralize(d, count), "ago"].join(" ");
    }
  }
  return "Less than a minute ago";
}

class LiveblogHeadlines extends ElementBase {
  constructor() {
    super();
    this.interval = null;
  }

  static get boundMethods() {
    return ["load"]
  }

  static get observedAttributes() {
    return ["src", "href"]
  }

  connectedCallback() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(this.load, defaultRefresh * 1000);
  }

  disconnectedCallback() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  attributeChangedCallback(attr, was, value) {
    this.load();
  }

  getDocument(url) {
    return new Promise(function(ok, fail) {
      var xhr = new XMLHttpRequest();
      xhr.responseType = "document";
      xhr.open("GET", url);
      xhr.send();
      xhr.onload = function() {
        ok(xhr.response);
      };
      xhr.onerror = fail;
    });
  }

  async load() {
    var elements = this.illuminate();
    var src = this.getAttribute("src");
    var href = this.getAttribute("href");
    if (!href) {
      href = src.replace(/\/[^\/]+$/, "/");
    }
    elements.moreLink.href = elements.titleLink.href = href;
    var rss = await this.getDocument(src);
    var headlines = $("item", rss).map(function(element) {
      var tags = $("category", element).map(c => c.innerHTML);
      var [flag] = tags.filter(t => t == "Fact Check" || t == "Major Development");
      var pubDate = $.one("pubDate", element).innerHTML
      var date = Date.parse(pubDate);
      var relative = relativeTime(date);
      return {
        headline: $.one("title", element).innerHTML,
        link: $.one("link", element).innerHTML,
        date, relative, tags, flag
      }
    });
    var max = this.hasAttribute("max") ? this.getAttribute("max") : 6;
    headlines = headlines.sort((a, b) => b.date - a.date).slice(0, max);
    elements.headlines.innerHTML = template({ headlines, formatAPDate, formatTime })
  }

  static get template() {
    return `
<div class="title">
  <a data-as="titleLink">
    <h2>
      <img src="../assets/logo-2020-e.svg" alt="Election 2020" />
      This Just In
    </h2>
  </a>
  <a data-as="moreLink" class="more">More &rsaquo;</a>
</div>

<ol data-as="headlines">`
  }
}

LiveblogHeadlines.define("liveblog-headlines");
