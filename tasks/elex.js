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

    var schedule = grunt.data.json.races;
    schedule.forEach(function(r) {
      // assign a timestamp
      var [m, d, y] = r.date.split("/");
      r.timestamp = new Date(y, m - 1, d);
      // split race IDs
      r.ids = r.raceID ? r.raceID.toString().split(/,\s*/g) : [];
    });

    var date = grunt.option("date");
    var today = new Date();
    if (date) {
      var [m, d, y] = date.split("/");
      today = new Date(y, m - 1, d);
    }
    var eventHorizon = new Date(today - 1000 * 60 * 60 * 24);

    var races = schedule.filter(
      r => r.timestamp <= today && r.timestamp >= eventHorizon
    );

    var test = grunt.option("test");
    var offline = grunt.option("offline");
    var live = !grunt.option("archive");
    var overrides = {
      calls: grunt.data.json.calls,
      candidates: grunt.data.json.candidates
    };

    api
      .getResults({ races, overrides, test, offline })
      .then(async function(results) {

        var unmatched = [];

        races.forEach(function(contest) {
          var { state, office, date, ids, feedOnly, filename } = contest;
          var tag = [state, office, date].join("_").replace(/\//g, "_");

          var fromAP = results.filter(function(result) {
            if (ids.length) {
              return ids.indexOf(result.id) > -1;
            }
            return result.office == contest.office &&
              result.state == contest.state &&
              result.date == contest.date;
          });
          if (!fromAP.length) {
            return unmatched.push(contest);
          }

          var subsetResults = function(geo = "state") {
            var copyKeys = "id eevp type party".split(" ");
            return fromAP.map(function(race) {
              var copy = {};
              for (var k of copyKeys) copy[k] = race[k];
              copy.results = race.results[geo];
              return copy;
            });
          }

          var stateResults = subsetResults("state");

          // console.log(`Generating results: ${tag}.json`)
          grunt.file.write(`build/data/${filename || tag}.json`, serialize(stateResults));

          if (contest.office != "H") {
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
            // console.log(`Generating county results: ${tag}_counties.json`)
            grunt.file.write(`build/data/${filename || tag}_counties.json`, serialize(countyResults));
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
        var now = new Date();
        var delegateFile = ["delegates", now.getMonth() + 1, now.getDate(), now.getFullYear()].join("_");
        var report = await api.getDelegates();
        var reportJSON = serializeReport;
        grunt.file.write(`build/data/${delegateFile}.json`, reportJSON);
        grunt.file.write("build/data/delegates.json", reportJSON);
      })
      .then(done)
      .catch(err => console.log(err));
  });
};
