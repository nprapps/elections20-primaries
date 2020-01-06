/*

Lots of flags available on this one:

--date=M/D/YYYY - pull data for this date (and the previous day)
  By default the rig will use today's date

--test - Ask the AP for test data

--offline - Use cached data if it exists

--archive - Set the "live" flag to false for all race JSON

*/

var api = require("./lib/ap");

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
    var overrides = {
      calls: grunt.data.json.calls,
      candidates: grunt.data.json.candidates
    };

    api
      .getResults({ races, overrides, test, offline })
      .then(function(results) {
        grunt.data.election = Object.assign(grunt.data.election || {}, results);

        for (var state in grunt.data.election) {
          var s = grunt.data.election[state];
          for (var office in s) {
            var o = s[office];
            for (var date in o) {
              var d = date.replace(/\//g, "");
              var result = o[date];
              grunt.file.write(
                `build/data/${state}_${office}_${d}.json`,
                JSON.stringify(result.state, null, 2)
              );
              if (result.counties) {
                grunt.file.write(
                  `build/data/${state}_${office}_${d}_counties.json`,
                  JSON.stringify(result.counties, null, 2)
                );
              }
            }
          }
        }

        done();
      })
      .catch(err => console.log(err));
  });
};
