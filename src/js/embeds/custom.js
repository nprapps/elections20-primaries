var $ = require("../lib/qsa");
var Sidechain = require("@nprapps/sidechain");

// all our potential custom elements

require("../components/president-primary");
require("../components/president-caucus");
require("../components/standard-primary");
require("../components/house-primary");
require("../components/delegate-total");

var search = new URLSearchParams(window.location.search);

var guest = Sidechain.registerGuest();

var placeholder = $.one(".placeholder");

var elementMap = {
  P: "president-primary",
  C: "president-caucus",
  H: "house-primary",
  G: "standard-primary",
  S: "standard-primary"
};

var race = search.get("race");
if (!elementMap[race]) {
  console.error("Race type doesn't have a matching display element");
} else {
  var tag = document.createElement(elementMap[race]);
  tag.src = `../data/${search.get("data")}.json`;
  tag.setAttribute("live", "15");

  if (search.has("link")) {
    tag.setAttribute("href", search.get("link"));
  }

  if (search.has("party")) {
    tag.setAttribute("party", search.get("party"));
  }

  var row = placeholder.parentElement;
  if (search.has("delegates") && (race == "P" || race == "C")) {
    placeholder.parentElement.replaceChild(tag, placeholder);
  } else {
    // wipe out delegates and the HR in favor of just our tag
    row.innerHTML = "";
    row.appendChild(tag);
  }

  if (search.has("district")) {
    tag.setAttribute("district", search.get("district"));
  }
}