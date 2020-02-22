/*

Lots of flags available on this one:

--date=M/D/YYYY - pull data for this date (and the previous day)
  By default the rig will use today's date

--test - Ask the AP for test data

--offline - Use cached data if it exists

--archive - Set the "live" flag to false for all race JSON

*/

var api = require("./lib/ap");
var depths = require("./lib/depths");

module.exports = function(grunt) {

  var elex = {};

  var serialize = d => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    var schedule = grunt.data.json.races.filter(r => r.office != "R");
    schedule.forEach(function(r) {
      // assign a timestamp
      var [m, d, y] = r.date.split("/");
      r.timestamp = new Date(y, m - 1, d);
      // split race IDs
      r.ids = r.raceID ? r.raceID.toString().split(/,\s*/g) : [];
      // split states
      r.states = r.state.split(/,\s*/g);
    });

    var date = grunt.option("date");
    var now = new Date();
    var day = 1000 * 60 * 60 * 24;
    var today;
    if (date) {
      // date is provided
      var [m, d, y] = date.split("/").map(Number);
      today = new Date(y, m - 1, d);
    } else {
      // start from tomorrow and work back
      today = new Date(now.valueOf() + day);
    }
    // Our window is 72 hours back in time
    // this should catch everything in the last day regardless of TZ
    var retroactive = new Date(today.valueOf() - day * 3);

    var races = schedule.filter(
      r => r.alwaysRun || (r.timestamp <= today && r.timestamp >= retroactive)
    );

    var test = grunt.option("test");
    var offline = grunt.option("offline");
    var live = !grunt.option("archive");
    var overrides = {
      calls: grunt.data.json.calls,
      candidates: grunt.data.json.candidates
    };

    // save some of this data for the build task
    grunt.data.elex = {
      schedule,
      races,
      today,
      retroactive
    };

    api
      .getResults({ races, overrides, test, offline })
      .then(async function(results) {

        var unmatched = [];

        races.forEach(function(contest) {
          var { states, office, date, ids, stateOnly, filename } = contest;

          var fromAP = results.filter(function(result) {
            if (ids.length) {
              return ids.indexOf(result.id) > -1;
            }
            return result.office == office &&
              states.indexOf(result.state) > -1 &&
              result.date == date;
          });
          if (!fromAP.length) {
            return unmatched.push(contest);
          }

          var subsetResults = function(geo = "state") {
            var copyKeys = "id eevp type party seat".split(" ");
            return fromAP.map(function(race) {
              var copy = {};
              for (var k in race) copy[k] = race[k];
              copy.results = race.results[geo];
              return copy;
            });
          }

          var stateResults = {
            test,
            closing: contest.closing,
            chatter: contest.chatter,
            footnote: contest.footnote,
            races: subsetResults("state")
          };

          // console.log(`Generating results: ${filename}.json`)
          grunt.file.write(`build/data/${filename}.json`, serialize(stateResults));

          if (office != "H" && !stateOnly) {
            var countyResults = subsetResults("county");
            // add county name from the FIPS table
            countyResults.forEach(function(race) {
              race.results.forEach(function(result) {
                var county = grunt.data.json.fips[result.fips];
                if (county && county.name) {
                  result.county = county.name;
                }
              })
            });
            // console.log(`Generating county results: ${filename}_counties.json`)
            grunt.file.write(`build/data/${filename}_counties.json`, serialize(countyResults));
          }

        });

        if (unmatched.length) {
          var dates = [...new Set(unmatched.map(r => r.date))];
          console.log("AP data not found for: ");
          dates.sort().forEach(function(d) {
            var missing = unmatched.filter(r => r.date == d).map(r => [r.state, r.office].join("-"));
            console.log(`  > ${d} - ${missing.join(", ")}`)
          })
        }

        // load delegate report for today
        // only runs if there are active races
        if (grunt.option("results-only")) return;
        var now = new Date();
        var delegateFile = ["delegates", now.getMonth() + 1, now.getDate(), now.getFullYear()].join("_");
        var report = await api.getDelegates();
        var reportJSON = serialize(report);
        grunt.file.write(`build/data/${delegateFile}.json`, reportJSON);
        grunt.file.write("build/data/delegates.json", reportJSON);
      })
      .then(done)
      .catch(err => console.log(err));
  });
};
