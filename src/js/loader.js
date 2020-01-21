var $ = require("./lib/qsa");

// load Sidechain and the legacy browser shim
require("@webcomponents/custom-elements");
var Sidechain = require("@nprapps/sidechain");

// ugh CorePub
$("[data-sidechain-src]").forEach(function(p) {
  p.innerHTML = `<side-chain src="${p.dataset.sidechainSrc}"></side-chain>`;
});

window.addEventListener("message", onMessage);