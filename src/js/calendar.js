require("./ads");
// var $ = require("./lib/qsa");

// var events = $("[data-days]");

// var { inDays } = require("./components/utils");

// var now = new Date();
// var days = inDays([now.getMonth() + 1, now.getDate(), now.getFullYear()].join("/"));
// events.forEach(function(event) {
//   var eventDays = event.dataset.days;
//   if (eventDays > days) {
//     var links = $(".links [href]", event);
//     links.forEach(a => a.removeAttribute("href"));
//     var resultsLabel = $(".results-label", event);
//     resultsLabel.forEach(a => a.remove());
//     var coverageLink = $(".coverage-link", event);
//     coverageLink.forEach(a => a.remove());
//   }
// });

// // also get rid of links for future results inside of past events
// // time is bad and increasingly meaningless
// $("a[data-days]").forEach(function(a) {
//   var aDays = a.dataset.days;
//   if (aDays > days) {
//     a.removeAttribute("href");
//   }
// });
// // if we removed all the future results links inside of a past event,
// // ditch the results label too
// $(".links").forEach(function(links) {
//   var contained = links.querySelectorAll("[href]");
//   var resultsLabel = links.querySelector(".results-label");
//   if (!contained.length && resultsLabel) {
//     resultsLabel.remove();
//   }
// })

// var months = $("section.month");
// var pastMonths = months.filter(function(section) {
//   var month = section.dataset.month;
//   var thisMonth = now.getMonth() + 1;
//   return month < thisMonth;
// });

// if (pastMonths.length) {
//   var previousLink = $.one("a.jump-to-past");
//   previousLink.classList.add("show");

//   var previousContainer = $.one("#past-months");
//   previousContainer.classList.add("show");
//   pastMonths.forEach(p => previousContainer.appendChild(p));
// }