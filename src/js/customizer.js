require("@nprapps/sidechain");
var $ = require("./lib/qsa");

var strings = require("../../data/strings.sheet.json");
var races = require("../../data/races.sheet.json").filter(r => !r.feedOnly && r.office != "R");

var form = $.one("form");
var preview = $.one("side-chain");
var embed = $.one("pre");

var stateSelect = $.one("form .state");
var raceSelect = $.one(`form [name="race"]`);

var states = [...new Set(races.map(r => r.state))].sort();
states.forEach(function(s) {
  var full = strings[s];
  if (!full) return;
  var option = document.createElement("option");
  option.value = s;
  option.innerHTML = full;
  stateSelect.appendChild(option);
});

var onFormChange = function() {
  var url = new URL("https://apps.npr.org/elections20-primaries/embeds/");
  var formData = {};
  $("select, input", form).forEach(function(input) {
    var name = input.name;
    if (input.type == "checkbox") {
      formData[name] = input.checked;
    } else {
      formData[name] = input.value;
    }
  });
  var [race, file] = formData.race.split(":");
  url.searchParams.set("race", race);
  url.searchParams.set("data", file);
  if (formData.party) {
    url.searchParams.set("party", formData.party);
  }
  if (formData.delegates) {
    url.searchParams.set("delegates", "");
  }
  url.searchParams.set("link", `https://apps.npr.org/elections20-primaries/states/${stateSelect.value}.html`);
  embed.innerHTML = `<p
  data-pym-loader
  data-child-src="${url.toString()}" 
  id="responsive-embed-sc-results">
    Loading...
</p>
<script src="https://pym.nprapps.org/npr-pym-loader.v2.min.js"></script>`.replace(/\</g, "&lt;");
  preview.setAttribute("src", url.toString());
}

$("select[name], input[name]").forEach(el => el.addEventListener("change", onFormChange));

var onStateChange = function() {
  raceSelect.innerHTML = "";
  var filtered = races.filter(r => r.state == stateSelect.value);
  filtered.forEach(function(r) {
    var option = document.createElement("option");
    option.value = `${r.caucus ? "C" : r.office}:${r.filename}`;
    option.innerHTML = `${r.date} - ${strings[r.office]}`;
    raceSelect.appendChild(option);
  });
  onFormChange();
};
stateSelect.addEventListener("change", onStateChange);
onStateChange();