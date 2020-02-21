var $ = require("./lib/qsa");
var Sidechain = require("@nprapps/sidechain");

// require possible elements
require("./components/iowa-widget");
require("./components/nevada-widget");
require("./components/president-primary");
require("./components/standard-primary");

var here = new URL(window.location.href);
if (here.searchParams.has("embedded")) {
  var guest = Sidechain.registerGuest();
}

var modules = $(".module");
var exactParams = "date office".split(" ");
var booleanParams = "counties".split(" ");

var onHashChange = function() {
  // construct a filter object from the hash
  // we do this using the built-in type for parsing URL search params
  var hash = window.location.hash.replace("#", "");
  if (!hash) return;
  var search = new URLSearchParams(hash);
  var params = {};
  for (var [key, val] of search.entries()) {
    params[key] = val;
  }
  // console.log(params);
  // now filter visible modules by looking for matching data params
  modules.forEach(function(module) {
    var visible = true;
    for (var p of exactParams) {
      if (module.dataset[p] != params[p]) visible = false;
    }
    for (var p of booleanParams) {
      if (module.dataset[p] && module.dataset[p] != params[p]) visible = false;
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
  })
}

window.addEventListener("hashchange", onHashChange);
onHashChange();