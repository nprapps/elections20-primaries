/*
Build a bundled app.js file using browserify
*/
module.exports = function(grunt) {

  var rollup = require("rollup");
  var fs = require("fs");
  var path = require("path");

  var plugins = {
    resolve: require("@rollup/plugin-node-resolve").nodeResolve,
    cjs: require("@rollup/plugin-commonjs"),
    less: require("./lib/rollup-less"),
    text: require("./lib/rollup-text"),
    json: require("@rollup/plugin-json"),
    babel: require("@rollup/plugin-babel").babel
  };


  var bundle = async function(mode) {

    //specify starter files here - if you need additionally built JS, just add it.
    var config = grunt.file.readJSON("project.json");
    var seeds = config.scripts;

    for (var [src, dest] of Object.entries(seeds)) {
      var bundle = await rollup.rollup({
        input: src,
        external: ["fs"],
        plugins: [
          plugins.resolve({
            browser: true,
            customResolveOptions: {
              paths: ["data"]
            }
          }),
          plugins.cjs({ sourceMap: false, requireReturnsDefault: "auto" }),
          plugins.less(),
          plugins.text(),
          plugins.json()
        ]
      });
      bundle.write({
        format: "iife",
        name: "nprnewsapps",
        // sourceMap: true,
        file: dest
      });
    }

  }

  grunt.registerTask("bundle", "Compile JS files", function(mode) {
    //run in dev mode unless otherwise specified
    mode = mode || "dev";
    var done = this.async();

    bundle(mode).then(done);

  });

};
