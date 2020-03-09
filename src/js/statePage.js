require("./ads");
var $ = require("./lib/qsa");
var Sidechain = require("@nprapps/sidechain");
var track = require("./lib/tracking");

// require possible elements
require("./components/president-primary");
require("./components/president-caucus");
require("./components/standard-primary");
require("./components/house-primary");
require("./components/county-detail");

var { formatAPDate, formatTime, inDays } = require("./components/utils");

var union = function(first, second) {
  var ignore = new Set(["state"]);
  var matching = true;
  var checks = [[first, second], [second, first]];
  for (var [a, b] of checks) {
    for (var [key, value] of a.entries()) {
      if (ignore.has(key)) continue;
      if (b.get(key) != value) matching = false;
    }
  }
  return matching;
};

var now = new Date();
var currentDay = inDays([now.getMonth() + 1, now.getDate(), now.getFullYear()].join("/"));
console.log(`Currently on day ${currentDay} of 2020`);
var here = new URL(window.location.href);
if (here.searchParams.has("embedded")) {
  var guest = Sidechain.registerGuest();
}

// disable future navigation items
if (!here.searchParams.has("eternal")) {
  $("[data-days]").forEach(function(element) {
    var navDays = element.dataset.days;
    if (navDays > currentDay) {
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
$("[data-live-days]").forEach(function(element) {
  var displayDays = element.dataset.liveDays * 1;
  // three day window
  var distance = Math.abs(currentDay - displayDays);
  if (distance < 3) {
    element.setAttribute("live", "");
  }
});

// module hash routing code
var modules = $(".module:not(.future)");
var noResultsModule = $.one(".module.future");
var exactParams = ["date", "office"];
var booleanParams = ["counties"];
var selectBox = $.one(".mobile-calendar");

var lazyLoad = function() {
  var elements = $(".module:not(.hidden) [data-src]");
  elements.forEach(function(element) {
    element.src = element.dataset.src;
    element.removeAttribute("data-src");
  });
};

var showLatest = function() {
  document.body.classList.remove("filtered");
  var moduleDates = modules.map(function(m) {
    var attribute = m.dataset.date;
    var days = inDays(attribute);
    return { days, attribute };
  }).sort((a, b) => a.days - b.days);
  var latest = moduleDates.filter(d => d.days <= currentDay).pop();
  if (!latest) {
    // if nothing is there, show the no-results module and hide everything else
    modules.forEach(m => m.classList.add("hidden"));
    noResultsModule.classList.remove("hidden");
    return;
  }
  var date = latest.attribute;
  var shown = modules.filter(function(module) {
    var hidden = !!(module.dataset.date != date || module.dataset.counties);
    module.classList.toggle("hidden", hidden);
    return !hidden;
  });
  return shown;
};

var showMatching = function(params) {
  // now filter visible modules by looking for matching data params
  var matched = modules.filter(function(module) {
    var visible = true;
    for (var p of exactParams) {
      if (params.get(p) == "true" && !(p in module.dataset)) {
        visible = false;
      } else if (module.dataset[p] != params.get(p)) {
        visible = false;
      }
    }
    for (var p of booleanParams) {
      if (module.dataset[p] && module.dataset[p] != params.get(p)) visible = false;
    }
    if (params.has("special")) {
      if (!module.dataset.special) visible = false;
    } else {
      if (module.dataset.special) visible = false;
    }
    module.classList.toggle("hidden", !visible);
    return visible;
  });
  return matched;
};

var onHashChange = function(e) {
  // construct a filter object from the hash
  // we do this using the built-in type for parsing URL search params
  $(".race-calendar .active").forEach(el => el.classList.remove("active"));
  var hash = window.location.hash.replace("#", "");
  // console.log(e, hash);
  var params = new URLSearchParams(hash);
  // set CSS hooks on the body
  exactParams.forEach(p => document.body.dataset[p] = params.get(p));
  booleanParams.forEach(p => document.body.classList.toggle(p, params.has(p)));
  noResultsModule.classList.add("hidden");
  // decide which way we go
  if (!hash) {
    showLatest();
  } else {
    document.body.classList.add("filtered");
    var matched = showMatching(params);
    if (!matched.length) showLatest();
  }

  // find things to toggle party
  $(`[data-control="party"]`).forEach(function(element) {
    if (params.has("party")) {
      element.setAttribute("party", params.get("party"));
    } else {
      element.removeAttribute("party");
    }
  });
  
  // send focus to the top-most module if this came from user interaction
  if (e) {
    track("state-nav", hash);
    if (params.has("counties") && !params.has("state")) {
      var countyModule = $.one(`.module:not(.hidden)[data-counties="true"]`);
      var headline = $.one("h2", countyModule);
      if (headline) headline.focus();
      countyModule.scrollIntoView({ behavior: "smooth" });
    } else {
      var headline = $.one(".module:not(.hidden) h2");
      if (headline) headline.focus();
    }
  }

  // set active desktop nav
  $(".race-calendar [href]").forEach(function(a) {
    var linkParams = new URLSearchParams(a.getAttribute("href").replace(/^#/, ""));
    if (union(params, linkParams)) {
      a.closest("li").classList.add("active");
    }
  })
  $(`.race-calendar [href="#${hash}"]`).forEach(el => el.closest("li").classList.add("active"));
  
  // set active mobile nav
  $("option", selectBox).forEach(function(option) {
    var optionParams = new URLSearchParams(option.value);
    if (union(optionParams, params)) {
      selectBox.value = option.value;
    }
  });

  lazyLoad();
}

window.addEventListener("hashchange", onHashChange);
onHashChange();

selectBox.addEventListener("change", function() {
  var hash = selectBox.value;
  window.location.hash = hash;
});

// listen for update events and fix the footer if heard
var lastUpdate = 0;
var updateSpan = $.one(".page-timestamp");

document.body.addEventListener("updatedtime", function(e) {
  var { updated } = e.detail;
  if (updated > lastUpdate) {
    lastUpdate = updated;
    var date = new Date(updated);
    console.log("New timestamp:", date);
    updateSpan.innerHTML = `, last updated ${formatAPDate(date)}, ${formatTime(date)}`;
  }
});