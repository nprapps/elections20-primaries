require("@nprapps/sidechain");
var $ = require("./lib/qsa");

var strings = require("strings.sheet.json");
var races = require("races.sheet.json").filter(r => !r.feedOnly && r.office != "R");

var form = $.one("form");
var preview = $.one("side-chain");
var embed = $.one("textarea");

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
  var prefix = "https://apps.npr.org/elections20-primaries/";
  var formData = {};
  $("select, input", form).forEach(function(input) {
    var name = input.name;
    if (input.type == "checkbox") {
      formData[name] = input.checked;
    } else {
      formData[name] = input.value;
    }
  });
  var [race, file, date] = formData.race.split(":");
  var url;
  form.dataset.type = formData.type;
  if (formData.type == "page") {
    url = new URL(`${prefix}states/${stateSelect.value}.html?embedded=true`);
    var hash = new URLSearchParams("");
    if (date) hash.set("date", date);
    if (race) {
      hash.set("office", race == "C" ? "P" : race);
      hash.set("counties", "true");
    }
    url.hash = hash.toString();
  } else {
    if (!race || !file) {
      preview.setAttribute("src", "");
      return;
    }
    url = new URL(`${prefix}embeds/?live`);
    url.searchParams.set("race", race);
    url.searchParams.set("data", file);
    if (formData.party) {
      url.searchParams.set("party", formData.party);
    }
    if (formData.delegates) {
      url.searchParams.set("delegates", "");
    }
    if (formData.link) {
      url.searchParams.set("link", `${prefix}states/${stateSelect.value}.html`);
    }
  }
  embed.innerHTML = `<p
  data-pym-loader
  data-child-src="${url.toString()}" 
  id="responsive-embed-sc-results">
    Loading...
</p>
<script src="https://pym.nprapps.org/npr-pym-loader.v2.min.js"></script>`.replace(/\</g, "&lt;");
  preview.setAttribute("src", url.toString().replace(prefix, ""));
}

$("select[name], input[name]").forEach(el => el.addEventListener("change", onFormChange));

var onStateChange = function() {
  raceSelect.innerHTML = "";
  var filtered = races.filter(r => r.state == stateSelect.value);
  var recent = document.createElement("option");
  recent.value = "";
  recent.innerHTML = "Most recent results (state page only)";
  raceSelect.appendChild(recent);
  filtered.forEach(function(r) {
    var option = document.createElement("option");
    option.value = `${r.caucus ? "C" : r.office}:${r.filename}:${r.date}`;
    option.innerHTML = `${r.date} - ${strings[r.office]}`;
    raceSelect.appendChild(option);
  });
  onFormChange();
};
stateSelect.addEventListener("change", onStateChange);
onStateChange();