/*

Build HTML files using any data loaded onto the shared state. See also loadCSV
and loadSheets, which import data in a compatible way.

*/

var path = require("path");
var typogr = require("typogr");
var template = require("./lib/template");

module.exports = function(grunt) {

  var process = function(source, data, filename) {
    var fn = template(source, { imports: { grunt: grunt, require: require }, sourceURL: filename });
    var input = Object.create(data || grunt.data);
    input.t = grunt.template
    return fn(input);
  };

  //expose this for other tasks to use
  grunt.template.process = process;

  grunt.template.formatNumber = function(s) {
    s = s + "";
    var start = s.indexOf(".");
    if (start == -1) start = s.length;
    for (var i = start - 3; i > 0; i -= 3) {
      s = s.slice(0, i) + "," + s.slice(i);
    }
    return s;
  };

  grunt.template.formatMoney = function(s) {
    s = grunt.template.formatNumber(s);
    return s.replace(/^(-)?/, function(_, captured) { return (captured || "") + "$" });
  };

  grunt.template.smarty = function(text) {
    var filters = ["amp", "widont", "smartypants", "ord"];
    filters = filters.map(k => typogr[k]);
    var filtered = filters.reduce((t, f) => f(t), text);
    return filtered;
  };

  grunt.template.include = function(where, data) {
    grunt.verbose.writeln(" - Including file: " +  where);
    var file = grunt.file.read(path.resolve("src/", where));
    var templateData = Object.create(data || grunt.data);
    templateData.t = grunt.template;
    return process(file, templateData, where);
  };

  grunt.registerTask("build", "Processes index.html using shared data (if available)", function() {
    var files = grunt.file.expandMapping(["**/*.html", "!**/_*.html", "!js/**/*.html"], "build", { cwd: "src" });
    files.forEach(function(file) {
      var src = file.src.shift();
      grunt.verbose.writeln("Processing file: " +  src);
      var input = grunt.file.read(src);
      var output = process(input, null, src);
      grunt.file.write(file.dest, output);
    });

    //generate state pages
    var states = [...new Set(grunt.data.json.races.map(r => r.state))].sort();
    if (grunt.option("state")) {
      var filter = grunt.option("state");
      states = states.filter(s => filter instanceof Array ? filter.indexOf(s) > -1 : s == filter);
    }
    var stateTemplate = grunt.file.read("src/_state.html");

    states.forEach(function(state) {
      var stateFull = grunt.data.json.strings[state];
      var stateAP = grunt.data.json.strings[state + "-AP"];

      // create a data object with its specific data
      var officeOrder = ["P", "G", "S", "H"];
      var newestFirst = (a, b) => b.timestamp - a.timestamp;
      var oldestFirst = (a, b) => {
        var diff = a.timestamp - b.timestamp
        if (diff) return diff;
        return officeOrder.indexOf(a.office) - officeOrder.indexOf(b.office);
      };
      var schedule = grunt.data.elex.schedule.filter(r => !r.feedOnly && r.state == state);

      var months = "Jan. Feb. March April May June July Aug. Sept. Oct. Nov. Dec.".split(" ");
      
      var displays = schedule.slice().sort(oldestFirst).map(function(race) {
        var [m, d] = race.date.split("/").map(Number);
        var item = {
          office: grunt.data.json.strings[race.office],
          date: [months[m - 1], d].join(" "),
          race
        }
        if (race.office != "H" && !race.singleParty) {
          item.parties = true;
        }
        return item;
      });

      var stateData = Object.assign({}, grunt.data, {
        state,
        stateFull,
        stateAP,
        schedule,
        displays
      });
      var output = process(stateTemplate, stateData, `states/${state}.html`);
      grunt.file.write(`build/states/${state}.html`, output);
    });
  });

}