require("./ads");
var $ = require("./lib/qsa");

var events = $("[data-days]");

var { inDays } = require("./components/utils");

var now = new Date();
var days = inDays([now.getMonth() + 1, now.getDate(), now.getFullYear()].join("/"));
events.forEach(function(event) {
  var eventDays = event.dataset.days;
  if (eventDays > days) {
    // var links = $.one(".links", event);
    // links.remove();
    // if we just want liks to not be clickable
    var links = $("[href]", event);
    links.forEach(a => a.removeAttribute("href"));
    var resultsLabel = $(".results-label", event);
    resultsLabel.forEach(a => a.remove());
    var coverageLink = $(".coverage-link", event);
    coverageLink.forEach(a => a.remove());
  }
});
