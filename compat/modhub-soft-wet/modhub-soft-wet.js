(function () {
 "use strict";
 if (window.ModHubSoftWet) return;
 const spec = {
  id: "ModHubSoftWet", version: "0.2.1", target: {name: "ModHub", versions: ["1.3.0"]},
  scope: ['#customOverlay[data-overlay="modloader"]'],
  fingerprint: {
   id: "modhub-overlay-1.3.0",
   safe: [[':scope>#customOverlayContent'], ['#overlayTabs.modhub-modloader-tabs']],
   required: [['#modHubModManageContainer.modhub-container', '#modHubModMarketContainer.modhub-container', '#modHubReadmeContainer.modhub-container', '#modHubLogContent.modhub-log-wrapper']]
  },
  roles: [
   {role: "page-shell", selectors: [":scope"], safe: true},
   {role: "toolbar", selectors: ['#overlayTabs.modhub-modloader-tabs'], safe: true},
   {role: "title", selectors: ['#customOverlayTitle'], safe: true},
   {role: "toolbar", selectors: ['.modhub-sticky-toolbar'], all: true},
   {role: "compact-row", selectors: ['.modhub-list .modhub-item'], all: true},
   {role: "card", selectors: ['.modhub-market-card'], all: true},
   {role: "section", selectors: ['.modhub-section'], all: true},
   {role: "danger-action", selectors: ['.modhub-btn-group .btn-delete'], all: true}
  ]
 };
 let owner = null, handle = null, reason = "runtime-unavailable";
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); owner = ui; handle = null; reason = ui ? "runtime-api-unsupported" : "runtime-unavailable";
  if (ui?.apiVersion !== 1 || typeof ui.getCapabilities !== "function" || typeof ui.registerStyleAdapter !== "function") return;
  try {if (!ui.getCapabilities().styleAdapters) {reason = "style-adapter-unavailable"; return}} catch {reason = "runtime-capability-failed"; return}
  try {handle = ui.registerStyleAdapter(spec)} catch {reason = "registration-failed"; /* Leave the original UI untouched. */ }
 }
 document.addEventListener("dol-ui-runtime-ready", attach);
 window.ModHubSoftWet = Object.freeze({
  getDiagnostics: () => handle?.getDiagnostics() ?? Object.freeze({status: "inactive", reason}),
  destroy() {document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); handle = null; owner = null; delete window.ModHubSoftWet}
 });
 attach();
})();
