var { issueTickets, redeemTicket } = require("./apResults");
var normalizeResults = require("./normalizeResults");

var getResults = async function(options) {
  var { test, offline, races } = options;
  var tickets = issueTickets(races);
  // console.log(`${tickets.length} tickets issued for AP data`);
  var rawResults = [];
  for (var ticket of tickets) {
    var data = await redeemTicket(ticket, options);
    if (data) rawResults.push(data);
  }
  return normalizeResults(rawResults, options.overrides)
};

module.exports = { getResults };
