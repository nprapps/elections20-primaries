/*

Constructs a nested primary results object of nested granularity:

state -> office -> date -> ".state"|".county"

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
      var data = {
        state: { test, id, candidates: [] },
        counties: { test, id, results: [] }
      }
      // process results at each geographic reporting unit
      race.reportingUnits.forEach(function(ru) {
        var updated = Date.parse(ru.lastUpdated);
        var candidates = ru.candidates.map(function(c) {
          var candidate = {
            first: c.first,
            last: c.last,
            party: c.party,
            id: c.polID,
            votes: c.voteCount,
            winner: call ? call.winner == c.polID : c.winner == "X"
          };
          var override = overrides.candidates[candidate.id];
          if (override) {
            Object.assign(candidate, override);
          }
          return candidate;
        });

        var winner = candidates.filter(c => c.winner).pop() || {};

        if (ru.level == "FIPSCode") {
          data.counties.results.push({
            fips: ru.fipsCode,
            winner: winner.id,
            updated,
            candidates
          });
        } else {
          state = ru.statePostal;
          data.state.winner = winner.id;
          data.state.updated = updated;
          data.state.candidates = candidates;
        }
      });

      data.state.total = data.state.candidates.reduce((acc, c) => acc + c.votes * 1, 0);
      
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