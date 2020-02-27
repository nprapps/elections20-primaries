require("./ads");
var $ = require("./lib/qsa");
var Sidechain = require("@nprapps/sidechain");

// require possible elements
require("./components/president-primary");
require("./components/president-caucus");
require("./components/standard-primary");
require("./components/house-primary");
require("./components/county-detail");

var now = new Date();
var here = new URL(window.location.href);
if (here.searchParams.has("embedded")) {
  var guest = Sidechain.registerGuest();
}

// disable future navigation items
if (!here.searchParams.has("eternal")) {
  $("[data-timestamp]").forEach(function(element) {
    var timestamp = element.dataset.timestamp * 1;
    if (timestamp > Date.now()) {
      element.setAttribute("disabled", "");
    }
  });
  document.body.addEventListener("click", function(e) {
    var disabled = e.target.closest("[disabled]");
    if (disabled) {
      e.preventDefault();
    }
  });
}

// set recent displays to be live
$("[data-live-timestamp]").forEach(function(element) {
  var timestamp = element.dataset.liveTimestamp * 1;
  // three day window
  var recently = timestamp + (1000 * 60 * 60 * 24 * 3);
  if (now < recently && now > timestamp) {
    element.setAttribute("live", "");
  }
});

var modules = $(".module:not(.future)");
var noResultsModule = $.one(".module.future");
var exactParams = ["date", "office"];
var booleanParams = ["counties"];

var lazyLoad = function() {
  var elements = $(".module:not(.hidden) [data-src]");
  elements.forEach(function(element) {
    element.src = element.dataset.src;
    element.removeAttribute("data-src");
  });
};

var onHashChange = function(e) {
  // construct a filter object from the hash
  // we do this using the built-in type for parsing URL search params
  $(".race-calendar .active").forEach(el => el.classList.remove("active"));
  var hash = window.location.hash.replace("#", "");
  noResultsModule.classList.add("hidden");
  if (!hash) {
    // show the latest items
    var moduleDates = modules.map(function(m) {
      var attribute = m.dataset.date;
      var [m, d, y] = attribute.split("/").map(Number);
      var date = new Date(y, m - 1, d);
      return { date, attribute };
    }).sort((a, b) => a.date - b.date);
    var latest = moduleDates.filter(d => d.date < now).pop();
    console.log(latest);
    if (!latest) {
      // if nothing is there, show the no-results module and hide everything else
      modules.forEach(m => m.classList.add("hidden"));
      noResultsModule.classList.remove("hidden");
      return;
    }
    var date = latest.attribute;
    modules.forEach(function(module) {
      module.classList.toggle("hidden", !!(module.dataset.date != date || module.dataset.counties));
    })
    lazyLoad();
    return;
  }
  $(`.race-calendar [href="#${hash}"]`).forEach(el => el.closest("li").classList.add("active"));
  document.body.classList.add("filtered");
  var search = new URLSearchParams(hash);
  var params = {};
  for (var [key, val] of search.entries()) {
    params[key] = val;
  }
  // set CSS hooks on the body
  exactParams.forEach(p => document.body.dataset[p] = params[p]);
  booleanParams.forEach(p => document.body.classList.toggle(p, p in params));
  // now filter visible modules by looking for matching data params
  modules.forEach(function(module) {
    var visible = true;
    for (var p of exactParams) {
      if (params[p] == "true" && !(p in module.dataset)) {
        visible = false;
      } else if (module.dataset[p] != params[p]) {
        visible = false;
      }
    }
    for (var p of booleanParams) {
      if (module.dataset[p] && module.dataset[p] != params[p]) visible = false;
    }
    if (params.special) {
      if (!module.dataset.special) visible = false;
    } else {
      if (module.dataset.special) visible = false;
    }
    module.classList.toggle("hidden", !visible);
    // find things to toggle party
    $(`[data-control="party"]`, module).forEach(function(element) {
      if (params.party) {
        element.setAttribute("party", params.party);
      } else {
        element.removeAttribute("party");
      }
    })
  });

  // send focus to the top-most module if this came from a click
  if (e) {
    var headline = $.one(".module:not(.hidden) h2");
    if (headline) headline.focus();
  }
  lazyLoad();
}

window.addEventListener("hashchange", onHashChange);
onHashChange();

var selectBox = $.one(".mobile-calendar");
selectBox.addEventListener("change", function() {
  var hash = selectBox.value;
  window.location.hash = hash;
});