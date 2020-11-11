var fs = require("fs").promises;
var less = require("less");
var path = require("path");

var npmImporter = require("./npm-less");

module.exports = function() {
  return {
    load(id) {
      if (!id.match(/\.(less|css)$/)) return null;
      return new Promise(async function(ok, fail) {
        var options = {
          paths: [ path.dirname(id) ],
          plugins: [ npmImporter ]
        };

        var contents = await fs.readFile(id, "utf-8");

        less.render(contents, options, function(err, result) {
          if (err) {
            fail(err);
          }
          var output = `
          var style = document.createElement("style");
          style.setAttribute("less", "${id}");
          style.innerHTML = ${JSON.stringify(result.css)};
          document.head.appendChild(style);
          `
          ok(output);
        });
      });
    }
  }
}