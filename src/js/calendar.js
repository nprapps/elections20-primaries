var $ = require("./lib/qsa");

var stamped = $("[data-timestamp]");

var now = Date.now();
stamped.forEach(function(event) {
  var timestamp = event.dataset.timestamp * 1;
  if (timestamp > now) {
    var links = $.one(".links", event);
    links.remove();
    // if we just want liks to not be clickable
    // var links = $("[href]", event);
    // links.forEach(a => a.removeAttribute("href"));
  }
});