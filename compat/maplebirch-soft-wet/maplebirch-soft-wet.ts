import type {UiApi, StyleAdapter, AdapterHandle, AdapterDiagnostics} from '../../src/public/ui';

declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>};
 DoLSavesUI?: {getEnabled: () => boolean};
 MapleBirchSoftWet?: Readonly<{getDiagnostics(): AdapterDiagnostics | Readonly<{status: 'inactive'; reason: string}>; destroy(): void}>;
};

(function () {
 "use strict";
 if (window.MapleBirchSoftWet) return;
 const spec: StyleAdapter = {
  id: "MapleBirchSoftWet", version: "0.2.2", target: {name: "maplebirch", versions: ["5.2.3"]},
  scope: ['#customOverlay[data-overlay="saves"]'],
  attributes: ['data-cloud-save-field'],
  fingerprint: {
   id: "maplebirch-cloud-5.2.3",
   safe: [[':scope>#customOverlayContent'], ['#maplebirch-cloud-save.maplebirch-cloud-save']],
   required: [['#maplebirch-cloud-save [data-cloud-save-field="endpoint"]'], ['#maplebirch-cloud-save [data-cloud-save-field="token"]']]
  },
  roles: [
   {role: "page-shell", selectors: [":scope"], safe: true},
   {role: "toolbar", selectors: ['#overlayTabs'], safe: true},
   {role: "title", selectors: ['#customOverlayTitle'], safe: true},
   {role: "section", selectors: ['#maplebirch-cloud-save>.settingsToggleItemWide'], all: true},
   {role: "toolbar", selectors: ['#maplebirch-cloud-save .maplebirch-cloud-save-actions'], all: true},
   {role: "danger-action", selectors: ['#maplebirch-cloud-save button.deleteButton'], all: true}
  ],
  when: () => window.DoLSavesUI?.getEnabled() === true
 };
 let owner: Partial<UiApi> | null | undefined = null;
 let handle: Readonly<AdapterHandle> | null = null, reason = "runtime-unavailable";
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); owner = ui; handle = null; reason = ui ? "runtime-api-unsupported" : "runtime-unavailable";
  if (ui?.apiVersion !== 1 || typeof ui.getCapabilities !== "function" || typeof ui.registerStyleAdapter !== "function") return;
  try {if (!ui.getCapabilities().styleAdapters) {reason = "style-adapter-unavailable"; return}} catch {reason = "runtime-capability-failed"; return}
  try {handle = ui.registerStyleAdapter(spec)} catch {reason = "registration-failed"; /* Leave the original UI untouched. */ }
 }
 document.addEventListener("dol-ui-runtime-ready", attach);
 window.MapleBirchSoftWet = Object.freeze({
  getDiagnostics: () => handle?.getDiagnostics() ?? Object.freeze({status: "inactive", reason}),
  destroy() {document.removeEventListener("dol-ui-runtime-ready", attach); handle?.destroy(); handle = null; owner = null; delete window.MapleBirchSoftWet}
 });
 attach();
})();
