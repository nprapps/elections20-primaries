/*

Constructs a nested primary results object of nested granularity:

state -> office -> date -> ".state"|".counties" -> party

A state/county results object contains:

- test: whether this was a test
- id: the AP race ID
- updated: last timestamp for the race from AP
- results
  - for state, this is an array of candidates
  - for county, this is a map of county FIPS to arrays of candidates
- winner: ID of the winner (also marked on the candidate result object)
- reporting: estimated expected vote percentage (EEVP) or by precinct

These are then passed back so that the elex task can look up results per-race and write out

*/

var depths = require("./depths");

var nprDate = apDate => {
  var [y, m, d] = apDate.split("-").map(parseFloat);
  return [m, d, y].join("/");
}

module.exports = function(resultArray, overrides) {
  var election = {};
  // handle each AP results call
  resultArray.forEach(function(results) {
    var date = nprDate(results.electionDate);
    var state = null;
    // create race objects
    results.races.forEach(function(race) {
      var test = race.test;
      var id = race.raceID;
      var call = overrides.calls[id];
      var office = race.officeID;
      var party = race.party;
      var eevp = race.eevp;
      var type = race.raceType;
      var data = {
        state: { test, id, eevp, type, candidates: [] },
        counties: { test, id, eevp, type, results: [] }
      }
      // process results at each geographic reporting unit
      // races that haven't run yet won't have these in non-test mode
      if (race.reportingUnits) race.reportingUnits.forEach(function(ru) {
        var updated = Date.parse(ru.lastUpdated);
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
            if (call.winner == c.polID) candidate.winner = true;
          } else if (c.winner == "X") {
            candidate.winner = true;
          }
          var override = overrides.candidates[candidate.id];
          if (override) {
            Object.assign(candidate, override);
          }
          return candidate;
        });

        var winner = (candidates.filter(c => c.winner).pop() || {}).id || false;
        var total = candidates.reduce((acc, c) => acc + c.votes * 1, 0);
        candidates.forEach(c => c.percentage = (c.votes / total * 100).toFixed(2) * 1);

        if (ru.level == "FIPSCode") {
          data.counties.results.push({
            fips: ru.fipsCode,
            winner,
            total,
            updated,
            candidates
          });

        } else {
          state = ru.statePostal;
          Object.assign(data.state, { winner, updated, candidates, total });
        }
      });

      
      // assemble object
      depths.set(election, [state, office, date, "state", party].join("."), data.state);
      if (data.counties.results.length) {
        data.counties.total = data.state.total;
        depths.set(election, [state, office, date, "counties", party].join("."), data.counties);
      }
    });
  });
  // console.log(JSON.stringify(election, null, 2));
  return election;
};
