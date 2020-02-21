/*

Custom element base class. Provides utility methods and common code patterns.

*/

class ElementBase extends HTMLElement {

  constructor() {
    super();
    // new.target is the current constructor function
    var def = new.target;
    // bind methods for events to the current element
    if (def.boundMethods) {
      def.boundMethods.forEach(f => this[f] = this[f].bind(this));
    }
    // these properties will update their attributes
    if (def.mirroredProps) {
      def.mirroredProps.forEach(p => Object.defineProperty(this, p, {
        get() { this.getAttribute(p) },
        set(v) { return this.setAttribute(p, v) }
      }));
    }
  }

  // send an event up the tree
  dispatch(event, detail) {
    var e = new CustomEvent(event, {
      bubbles: true,
      composed: true,
      detail
    });
    this.dispatchEvent(e);
  }

  // catch and halt an event
  // useful for modifying and re-dispatching events
  capture(event, listener) {
    this.addEventListener(event, function(e) {
      e.stopPropagation();
      listener(e);
    });
  }

  // looks for a static template getter on the class
  // injects that HTML into the element's light DOM
  // returns a hash of "data-as" elements
  // this is memoized and will only "run" once
  illuminate() {
    var template = this.constructor.template;
    this.innerHTML = template;
    var manuscript = {};
    var landmarks = this.querySelectorAll("[data-as]");
    for (var l of landmarks) {
      var key = l.dataset.as;
      manuscript[key] = l;
    }
    this.illuminate = () => manuscript;
    return manuscript;
  }

  // sort of like d3.data but for data -> elements
  // returns a zipped array of [data, element] pairs
  mapToElements(root, array, element = "div") {
    var children = Array.from(root.children);
    var binding = new Map();

    array.forEach(function(item) {
      var [child] = children.filter(c => c.dataset.key == item.id);
      if (!child) {
        // create a node and append it
        child =
          typeof element == "function"
            ? element(item)
            : document.createElement(element);
        child.dataset.key = item.id;
        children.push(child);
        root.appendChild(child);
      }
      binding.set(child, item);
      binding.set(item, child);
    });

    // remove deleted children
    children.forEach(function(child) {
      if (!binding.has(child)) {
        root.removeChild(child);
      }
    });

    // sort children to match array order
    children = Array.from(root.children);
    var pairs = array.map(function(item, i) {
      var child = binding.get(item);
      var childIndex = children.indexOf(child);
      if (childIndex != i) {
        var next = children[i + 1];
        if (next) {
          root.insertBefore(child, next);
        } else {
          root.appendChild(child);
        }
      }
      return [item, child];
    });
    return pairs;
  }

  // handle registration
  static define(tag) {
    try {
      window.customElements.define(tag, this);
    } catch (err) {
      console.log(`Couldn't (re)define ${tag} element`);
    }
  }
}

module.exports = ElementBase;