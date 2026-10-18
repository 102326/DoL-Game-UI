import type {UiApi, StyleAdapter, AdapterHandle, AdapterDiagnostics} from '../../src/public/ui';

declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>};
 ModHubSoftWet?: Readonly<{getDiagnostics(): AdapterDiagnostics | Readonly<{status: 'inactive'; reason: string}>; destroy(): void}>;
};

(function () {
 "use strict";
 if (window.ModHubSoftWet) return;
 const spec: StyleAdapter = {
  id: "ModHubSoftWet", version: "1.0.0", target: {name: "ModHub", versions: [">=1.3.0"]},
  scope: ['#customOverlay[data-overlay="modloader"]'],
  fingerprint: {
   id: "modhub-overlay-1.3.0",
   safe: [[':scope>#customOverlayContent'], ['#overlayTabs.modhub-modloader-tabs']],
   required: [['#modHubModManageContainer.modhub-container', '#modHubModMarketContainer.modhub-container', '#modHubReadmeContainer.modhub-container', '#modHubLogContent.modhub-log-wrapper', '#modHubHelpContainer.modhub-container.modhub-help']]
  },
  roles: [
   {role: "page-shell", selectors: [":scope"], safe: true},
   {role: "toolbar", selectors: ['#overlayTabs.modhub-modloader-tabs'], safe: true},
   {role: "title", selectors: ['#customOverlayTitle'], safe: true},
   {role: "toolbar", selectors: ['.modhub-sticky-toolbar'], all: true},
   {role: "compact-row", selectors: ['.modhub-list .modhub-item'], all: true},
   {role: "card", selectors: ['.modhub-market-card'], all: true},
   {role: "section", selectors: ['.modhub-section,.modhub-stat-card,.modhub-help-section,.modhub-help-home-block'], all: true},
   {role: "danger-action", selectors: ['.modhub-btn-group .btn-delete'], all: true}
  ]
 };
 // ModHub portals this reviewed menu to body; it is no longer inside the overlay.
 const toolsSpec: StyleAdapter = {
  id: 'ModHubSoftWetTools', version: '1.0.0', target: spec.target,
  scope: ['#modHubManagerToolsMenu.modhub-manager-tools-menu[role="menu"]'],
  fingerprint: {id:'modhub-manager-tools-1.7.6', safe:[[':scope']], required:[[':scope>.modhub-manager-tool-row:first-child>.modhub-manager-tool-action']]},
  roles: [{role:'page-shell',selectors:[':scope'],safe:true},{role:'toolbar',selectors:['.modhub-manager-tool-row'],all:true}]
 };
 let owner: Partial<UiApi> | null | undefined = null;
 let handle: Readonly<AdapterHandle> | null = null, tools: Readonly<AdapterHandle> | null = null, reason = "runtime-unavailable";
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); tools?.destroy(); owner = ui; handle = tools = null; reason = ui ? "runtime-api-unsupported" : "runtime-unavailable";
  if (ui?.apiVersion !== 1 || typeof ui.getCapabilities !== "function" || typeof ui.registerStyleAdapter !== "function") return;
  try {if (!ui.getCapabilities().styleAdapters) {reason = "style-adapter-unavailable"; return}} catch {reason = "runtime-capability-failed"; return}
  try {handle = ui.registerStyleAdapter(spec); tools = ui.registerStyleAdapter(toolsSpec)} catch {reason = "registration-failed"; /* Leave unmatched components native. */ }
 }
 document.addEventListener("dol-ui-runtime-ready", attach);
 window.ModHubSoftWet = Object.freeze({
  getDiagnostics: () => handle ? Object.freeze({...handle.getDiagnostics(),components:{tools:tools?.getDiagnostics()}}) : Object.freeze({status: "inactive", reason}),
  destroy() {document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); tools?.destroy(); handle = tools = null; owner = null; delete window.ModHubSoftWet}
 });
 attach();
})();
