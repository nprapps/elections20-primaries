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

var nprDate = apDate => {
  var [y, m, d] = apDate.split("-").map(parseFloat);
  return [m, d, y].join("/");
}

module.exports = function(resultArray, overrides) {
  var election = {};
  // handle each AP results call
  resultArray.forEach(function(results) {
    var date = nprDate(results.electionDate);
    var updated = Date.parse(results.timestamp);
    var state = null;
    // create race objects
    results.races.forEach(function(race) {
      var test = race.test;
      var id = race.raceID;
      var call = overrides.calls[id];
      var office = race.officeID;
      var data = {
        state: {
          test, id, votes: 0, results: []
        },
        counties: null
      };
      // process results at each geographic reporting unit
      race.reportingUnits.forEach(function(ru) {
        var winner;
        // update the result object
        var dest = ru.level == "state" ? data.state : {
          fips: fipsCode,
          votes: 0,
          results: []
        };
        if (call && call.winner) {
          dest.winner = call.winner;
        }
        if (ru.statePostal) state = ru.statePostal;
        dest.results = ru.candidates.map(function(c) {
          var remapped = {
            party: c.party,
            id: c.polID,
            votes: c.voteCount,
            first: c.first,
            last: c.last
          };
          var override = overrides.candidates[remapped.id];
          if (override) {
            Object.assign(remapped, override);
          }
          if (call) {
            if (call == remapped.id) {
              remapped.winner = true;
            }
          } else {
            if (c.winner == "X") {
              remapped.winner = true;
              dest.winner = remapped.id;
            }
          }
          return remapped;
        });
        if (ru.level == "FIPScode") {
          // create county array if necessary and add this result
          if (!data.counties) data.counties = [];
          data.counties.push(dest);
        }
      });
      
      // assemble object
      if (!election[state]) election[state] = {};
      if (!election[state][office]) election[state][office] = {};
      election[state][office][date] = data;
    });
  });
  return election;
};