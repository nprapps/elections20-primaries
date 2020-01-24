/*

Builds an array of normalized races from an array of multiple API responses.
These are not yet grouped--it's just to compute subtotals and rename columns.
The calling task will need to create the lookup map from races to individual
race IDs.

*/

var depths = require("./depths");

var nprDate = apDate => {
  var [y, m, d] = apDate.split("-").map(parseFloat);
  return [m, d, y].join("/");
}

module.exports = function(resultArray, overrides) {
  var races = [];
  // handle each AP results call
  resultArray.forEach(function(results) {
    var date = nprDate(results.electionDate);
    // create race objects
    results.races.forEach(function(race) {
      var test = race.test;
      var id = race.raceID;
      var call = overrides.calls[id];
      if (call) call = call.winner.toString().split(/,\s*/);
      var office = race.officeID;
      var party = race.party;
      var eevp = race.eevp;
      var type = race.raceType;
      // this is the final race output object
      var data = {
        id, date, test,
        state: null, // will be filled in later based on state RU, it's weird
        eevp, party, type, office,
        results: {
          state: [],
          county: []
        }
      }
      // group results by reporting unit
      // races that haven't run yet won't have these in non-test mode
      if (race.reportingUnits) race.reportingUnits.forEach(function(ru) {
        var updated = Date.parse(ru.lastUpdated);
        var precincts = ru.precinctsTotal;
        var reporting = ru.precinctsReporting;
        var reportingPercentage = ru.precinctsReportingPct;

        var candidates = ru.candidates.map(function(c) {
          var candidate = {
            first: c.first,
            last: c.last,
            party: c.party,
            id: c.polID,
            votes: c.voteCount
          };
          // add winner field only if they won
          if (call) {
            updated = Date.now();
            if (call.indexOf(c.polID) > -1) candidate.winner = true;
          } else if (c.winner == "X") {
            candidate.winner = true;
          }
          var override = overrides.candidates[candidate.id];
          if (override) {
            Object.assign(candidate, override);
          }
          return candidate;
        });

        // generate subtotals/percentages
        var winners = candidates.filter(c => c.winner).map(c => c.id) || [];
        var total = candidates.reduce((acc, c) => acc + c.votes * 1, 0);
        candidates.forEach(c => c.percentage = (c.votes / total * 100).toFixed(2) * 1);

        var metadata = { id, party, updated, precincts, reporting, reportingPercentage };

        if (ru.level == "FIPSCode") {
          // do not set a winner at the county level
          data.results.county.push({
            fips: ru.fipsCode,
            ...metadata,
            total,
            candidates
          });
        } else {
          data.state = ru.statePostal; // here it is
          data.results.state.push({
            ...metadata,
            winners,
            total,
            candidates
          });
        }
      });
      races.push(data);
    });
  });
  return races;
};
