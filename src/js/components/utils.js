var apMonths = [ "Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec." ];

var timezones = [
  { re: /\(eastern/i, zone: "ET" },
  { re: /\(central/i, zone: "CT" },
  { re: /\(mountain/i, zone: "MT" },
  { re: /\(pacific/i, zone: "PT" }
];

var formatAPDate = date => `${apMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
var formatTime = function(date) {
  var h = date.getHours()
  var m = date.getMinutes().toString().padStart(2, "0");
  var suffix = h > 12 ? "p.m." : "a.m.";
  var offset = date.getTimezoneOffset() / 60;
  var zone = "";
  if (offset > 5 && offset < 9) {
    var ts = date.toTimeString();
    var match = timezones.filter(tz => ts.match(tz.re)).pop();
    if (match) zone = " " + match.zone;
  }
  if (h > 12) {
    h -= 12;
  }
  return `${h}:${m} ${suffix}${zone}`;
};

var parseNPRDate = function(d) {
  var [m, d, y] = d.split("/");
  return new Date(y, m - 1, d);
};

var groupBy = function(list, key) {
  var grouped = {};
  list.forEach(function(item) {
    var value = item[key];
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(item);
  });
  return grouped;
};

module.exports = {
  apMonths,
  formatAPDate,
  formatTime,
  parseNPRDate,
  groupBy
}