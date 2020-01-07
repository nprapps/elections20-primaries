// a set of utility functions for safely working with deep object paths
// call with dot.separated.keypaths within an object

module.exports = {
  // get a value at the keypath or undefined if any step failed in the chain
  get: function(obj, keys) {
    if (typeof keys == "string") {
      keys = keys.split(".");
    }
    var end = keys.pop();
    var branch = obj;
    for (var k of keys) {
      if (!branch[k]) return undefined;
      branch = branch[k];
    }
    return branch[end];
  },

  // set a value at the keypath, creating missing intermediate objects
  set: function(obj, keys, value) {
    if (typeof keys == "string") {
      keys = keys.split(".");
    }
    var end = keys.pop();
    var branch = obj;
    for (var k of keys) {
      if (!branch[k]) branch[k] = {};
      branch = branch[k];
    }
    branch[end] = value;
  },

  // recurse down a path
  // callback will get the keypath params, plus the final data value
  // i.e., "a.b.c" will result in `{ a: keyForA, b: keyForB }, c` at the callback
  recurse: function(obj, keys, callback) {
    if (typeof keys == "string") {
      keys = keys.split(".");
    }

    var walk = function(branch, params, path) {
      if (path.length) {
        // recurse again
        var here = path[0];
        var remaining = path.slice(1);
        for (var k in branch) {
          walk(branch[k], Object.assign({}, params, { [here]: k }), remaining);
        }
      } else {
        // at the end
        callback(params, branch);
      }
    };

    walk(obj, {}, keys);
  }
}