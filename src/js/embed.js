// load custom element shim
var Sidechain = require("@nprapps/sidechain");
var guest = Sidechain.registerGuest();

// load the various result elements
require("./components/iowa-widget");
require("./components/nevada-widget");
require("./components/president-primary");
require("./components/governor-primary");
require("./components/delegate-total");