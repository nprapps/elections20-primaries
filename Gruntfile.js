module.exports = function(grunt) {
  //load tasks
  grunt.loadTasks("./tasks");

  grunt.registerTask("update", "Download content from remote services", function(target = stage) {
    grunt.task.run(["sheets", "docs", `sync:${target}`]);
  });
  grunt.registerTask("content", "Load content from data files", [
    "state",
    "json",
    "csv",
    "markdown",
    "archieml",
    "elex"
  ]);
  grunt.registerTask("template", "Build HTML from content/templates", [
    "content",
    "build"
  ]);
  grunt.registerTask("static", "Build all files", [
    "copy",
    "bundle",
    "less",
    "template"
  ]);
  grunt.registerTask("quick", "Build without assets", [
    "clean",
    "bundle",
    "less",
    "template"
  ]);
  grunt.registerTask("ap", "Get AP data", ["state", "json", "elex"]);
  grunt.registerTask("serve", "Start the dev server", ["connect:dev", "watch"]);
  grunt.registerTask("default", ["clean", "static", "serve"]);
  // server tasks
  grunt.registerTask("local", "Run the server for testing events", ["sheets", "static", "connect:dev", "cron:60:local"]);
  grunt.registerTask("deploy", "Deploy HTML to stage on a timer", ["sheets", "static", "publish", "cron:30:publish"]);
  grunt.registerTask("deploy-live", "Deploy HTML to live on a timer", ["sheets", "static", "publish:live", "cron:20:publishLive"]);
};
