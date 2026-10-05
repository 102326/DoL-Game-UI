(function () {
 "use strict";
 if (window.DolOptimizationSoftWet) return;
 const spec = {
  id: "DolOptimizationSoftWet", version: "0.1.2",
  target: {name: "原版优化", versions: ["1.1.1.2"]},
  scope: ['#customOverlay'],
  fingerprint: {
   id: "optimization-idb-saves-1.1.1.2",
   safe: [['#saveList'], ['#overlayTabs']],
   required: [['#saveList #saves-list-container'], ['#saveList #pageNum'], ['#saveList #pageLen']]
  },
  when: () => document.getElementById('customOverlay')?.dataset.overlay === 'saves' && window.DoLGameUI?.getPreferences?.().savesEnabled === true && window.DoLGameUI?.ui?.getCapabilities?.().hasSelector === true,
  roles: [
   {role: "list", selectors: ['#saves-list-container']},
   {role: "compact-row", selectors: ['#saves-list-container>.savesListRow'], all: true},
   {role: "status", selectors: ['#saves-list-container .datestamp'], all: true},
   {role: "danger-action", selectors: ['#saves-list-container .deleteButton', '#saveList .saves-clear'], all: true}
  ]
 };
 let owner = null, handle = null, reason = "runtime-unavailable";
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); owner = ui; handle = null;
  reason = ui ? "runtime-api-unsupported" : "runtime-unavailable";
  if (ui?.apiVersion !== 1 || typeof ui.registerStyleAdapter !== "function" || typeof ui.getCapabilities !== "function") return;
  try {
   if (!ui.getCapabilities().styleAdapters) {reason = "style-adapter-unavailable"; return}
   handle = ui.registerStyleAdapter(spec);
  } catch {reason = "registration-failed"}
 }
 document.addEventListener("dol-ui-runtime-ready", attach);
 window.DolOptimizationSoftWet = Object.freeze({
  getDiagnostics: () => handle?.getDiagnostics() ?? Object.freeze({status: "inactive", reason}),
  destroy() {document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); handle = null; owner = null; delete window.DolOptimizationSoftWet}
 });
 attach();
})();
