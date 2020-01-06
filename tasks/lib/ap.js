var axios = require("axios");
var fs = require("fs").promises;
var depths = require("./depths");
var etags = {};

var resultsURL = "https://api.ap.org/v2/elections/";
var resultsParams = {
  apikey: process.env.AP_API_KEY,
  uncontested: false,
  format: "json"
};

var apDate = function(d) {
  if (typeof d == "string") {
    var [m, d, y] = d.split("/");
    d = new Date(y, m - 1, d);
  }
  return [
    d.getFullYear(),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d
      .getDate()
      .toString()
      .padStart(2, "0")
  ].join("-");
};

var normalizeResults = require("./normalizeResults");

var issueTickets = function(races) {
  // build a list of "tickets" - API requests that will satisfy the races we want
  var tickets = [];
  // races that have their own ID need their own ticket
  var mergable = races.filter(function(r) {
    if (!r.raceID) return true;
    tickets.push({
      date: apDate(r.timestamp),
      params: {
        raceID: r.raceID,
        statePostal: r.state,
        level: r.counties ? "FIPScode" : "state"
      }
    });
  });
  // combine other tickets by date and granularity
  var grouped = {};
  mergable.forEach(function(r) {
    var level = r.counties ? "FIPScode" : "state";
    var keypath = apDate(r.timestamp) + "." + level;
    var group = depths.get(grouped, keypath) || [];
    group.push(r);
    depths.set(grouped, keypath, group);
  });
  depths.recurse(grouped, "date.level", function(params, data) {
    var { date, level } = params;
    var states = data.map(r => r.state);
    var offices = data.map(r => r.office);
    var merged = {
      date,
      params: {
        level,
        statePostal: [...new Set(states)],
        officeID: [...new Set(offices)]
      }
    };
    tickets.push(merged);
  });
  return tickets;
};

var redeemTicket = async function(ticket, options) {
  var tag =
    ticket.date +
    "_" +
    Object.keys(ticket.params)
      .sort()
      .map(p => `${p}=${ticket.params[p]}`)
      .join("&");
  if (options.offline) {
    try {
      var json = await fs.readFile(`temp/${tag}.json`);
      var data = JSON.parse(json);
      console.log(`Loaded offline data from temp/${tag}.json`);
      return data;
    } catch(err) {
      console.log(`Couldn't load data for tag ${tag} - does the file exist?`);
      throw err;
    }
  } else {
    var headers = {};
    if (etags[tag]) headers["If-None-Match"] = etags[tag];
    try {
      var response = await axios({
        url: resultsURL + ticket.date,
        params: Object.assign({}, resultsParams, ticket.params, { test: !!options.test }),
        headers
      });
      var data = response.data;
      await fs.mkdir("temp", { recursive: true });
      await fs.writeFile(`temp/${tag}.json`, JSON.stringify(data, null, 2));
      etags[tag] = response.headers.etag;
      return data;
    } catch (err) {
      console.log(err);
      // throw err;
    }
  }
}

var getResults = async function(options) {
  var { test, offline, races } = options;
  var tickets = issueTickets(races);
  var rawResults = [];
  for (var ticket of tickets) {
    var data = await redeemTicket(ticket, options);
    rawResults.push(data);
  }
  return normalizeResults(rawResults, options.overrides)
};

module.exports = { getResults, apDate };
