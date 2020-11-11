var fs = require("fs").promises;

module.exports = function() {
  return {
    async load(id) {
      if (id.match(/\.(txt|svg|html|glsl)$/)) {
        var contents = await fs.readFile(id, "utf-8");
        return `export default ${JSON.stringify(contents)}`;
      }
      return null;
    }
  }
}