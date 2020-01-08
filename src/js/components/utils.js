var apMonths = [ "Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec." ];

var apDate = date => `${apMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
var time = function(date) {
  var h = date.getHours()
  var m = date.getMinutes().toString().padStart(2, "0");
  var suffix = h > 12 ? "PM" : "AM";
  if (h > 12) {
    h -= 12;
  }
  return `${h}:${m} ${suffix}`;
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
  apDate,
  time,
  groupBy
}