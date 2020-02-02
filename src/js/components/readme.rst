About our components
====================

Here's the problem: in all our election rigs (and broadly speaking our other
projects), we try not to use information stored between runs whenever
possible. This is not a problem for the general, since it is essentially one
atomic "event," both from our perspective and from that of the AP election
API.

However, the primary is not a single event, but a season of events. We need to
be able to present information across that season, but we'd still prefer not
to introduce local state to the build process (as this complicates our ability
to run it across different machines or over time). How do we give our users
the illusion of statefulness, while remaining stateless?

To complicate matters further, the AP elections API also treats "days" as the
base level for pulling results. There's no built-in way to ask for "all
presidential primary races," except by making multiple requests (one per day).
The API is also rate-limited, meaning that we can only get so many results per
minute. We can't, therefore, simply build our rig to ask for everything on
every single run, since that will get us locked out in short order.

Finally, for some reports (namely delegates), the AP does not keep historical
records--you can't ask them for "what was the delegate count on such-and-such
a day?" You get the current totals, and a relative comparison (1/7 days in the
past). We would obviously like to have more information than this.

The solution
------------

Instead of having a memory in the rig itself, we'll treat S3 as our memory--we
never delete files from S3, so anything that we publish will still be there at
a later time. Individual files can be published with names derived from the
state/office/date for that contest, and then components in the page can load
them at run-time. This should still be searchable by Google (the surrounding
titles and chatter will be published in the HTML, and the components should
run in the headless crawler), and it means that the build process itself
doesn't actually have to know anything about the in-page data.

When creating these components, we have several options, but I've decided (for
the moment) to go with standard custom elements instead of a framework, for a
few reasons:

* Custom elements are self-mounting, meaning that they'll initialize themselves in the page and are easy to lazy-load for station embeds.
* They don't require the download/parse weight of a framework.
* They share no state with each other, so their disadvantages there are irrelevant.
* I'm familiar with them, and confident that they're easy to train new staffers on.

Implementation
--------------

In this folder, each component should have its own subfolder to contain its
own logic, styles, and templates. The entry point for the component (where its
class is defined and registered with the browser) should be called
``index.js``. Common code, such as the element base class or utility
functions, should be stored in this folder itself.

Hooks in our Browserify bundler let you ``require()`` styles and text content
from other files. Note that if you load styles this way, they can still import
other files (including our ``values.less`` from up the source tree). Using
styles in the JS bundle is a good way to make sure that we only load styles
that are necessary for a component, which will make the styles on embedded
pages smaller.

If you've never used custom elements before, the `MDN tutorial page
<https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements>`_
for them is pretty good. Essentially, each element is a class that extends
``HTMLElement`` and may implement some lifecycle methods:

* ``constructor()`` - must call ``super()``, and initializes the component. Note that you're not allowed to change the contents of the element or its attributes here, unless you use Shadow DOM (we usually don't).
* ``connectedCallback()`` - is called for you when the element is actually placed in the document. You can start mutating the element here.
* ``disconnectedCallback()`` - called when the element is removed. Useful for halting long-running processes, like timers or media playback.
* ``attributeChangedCallback()`` - called when an attribute is changed in the DOM, or when the attributes are initially created. You have to list an attribute name in the ``obserservedAttributes`` static getter for this to work.

All our elements should inherit from the base class, which eases some of the pain points in the API:

* setting the ``boundMethods`` static getter on your element class should automatically bind those methods to their instance, so that they can be passed directly into listeners (``this.addEventListener("click", this.onClicked)``).
* setting the ``mirroredProps`` static getter will cause properties to automatically set the matching DOM attribute.
* the ``dispatch()`` method makes it easier to send a custom event up the DOM.
* likewise, ``capture()`` lets you register a listener that will halt propagation on an event from a child element (often used to modify the event before re-dispatching it).

To simplify the process of creating and accessing the inner contents of the
component, you can specify ``static get template`` on your class, then call
``this.illuminate()`` to inject that markup and return an object containing
all elements marked with a ``data-as`` attribute. After the first call,
``illuminate()`` is memoized: it will only set HTML and find landmarks once,
meaning that those bindings are stable for adding event listeners or injecting
templated content into specific parts of the component's DOM.