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
  grunt.registerTask("elex", function() {
    grunt.task.requires("json"); // we need the schedule sheet

    var done = this.async();

    var schedule = grunt.data.json.races;
    schedule.forEach(function(r) {
      var [m, d, y] = r.date.split("/");
      r.timestamp = new Date(y, m - 1, d);
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
      .then(function(results) {
        grunt.data.election = Object.assign(grunt.data.election || {}, results);

        var keypath = "state.office.date";
        depths.recurse(grunt.data.election, keypath, function(params, data) {
          var tag = keypath
            .split(".")
            .map(p => params[p].replace(/\//g, ""))
            .join("_");
          var { state, counties } = data;
          grunt.file.write(
            `build/data/${tag}.json`,
            JSON.stringify(state, null, 2)
          );
          if (counties) {
            grunt.file.write(
              `build/data/${tag}_counties.json`,
              JSON.stringify(counties, null, 2)
            );
          }
        });

        done();
      })
      .catch(err => console.log(err));
  });
};
