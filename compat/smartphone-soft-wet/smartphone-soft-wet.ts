import type {UiApi, StyleAdapter, AdapterHandle, AdapterDiagnostics} from '../../src/public/ui';

declare const window: Window & {
 DoLGameUI?: {ui?: Partial<UiApi>};
 SmartPhoneSoftWet?: Readonly<{getDiagnostics(): AdapterDiagnostics | Readonly<{status: 'inactive'; reason: string}>; destroy(): void}>;
};

(function () {
 'use strict';
 if (window.SmartPhoneSoftWet) return;
 const spec: StyleAdapter = {
  id: 'SmartPhoneSoftWet', version: '1.1.1', target: {name: 'SmartPhone Alpha', versions: ['0.3.91', '0.3.91.1']},
  // The author recreates the phone asynchronously; observe its stable wrapper across app switches.
  scope: ['#phone-wrapper'],
  fingerprint: {
   id: 'smartphone-0.3.91', safe: [[':scope>#phone-render']],
   required: [['#phone-render>#smart-phone-container.phone-main>.phone-screen-locked'], ['#smart-phone-container>.phone-screen-unlocked>.phone-status-bar'], ['#smart-phone-container>.phone-screen-unlocked>#phone-content.phone-content'], ['#smart-phone-container>.phone-screen-unlocked>.phone-tool-bar']]
  },
  roles: [
   {role: 'page-shell', selectors: ['#phone-render>#smart-phone-container.phone-main']},
   {role: 'toolbar', selectors: ['#smart-phone-container>.phone-screen-unlocked>.phone-tool-bar']}
  ]
 };
 const debugSpec: StyleAdapter = {
  id: 'SmartPhoneSoftWetDebug', version: '1.1.1', target: spec.target,
  scope: ['#smartphone_debug'],
  fingerprint: {
   id: 'smartphone-debug-0.3.91', safe: [[':scope>#smart-phone-debug-container']],
   required: [['#smart-phone-debug-container>#smartphone_debug_msg'], ['#smart-phone-debug-container>#excute-js'], ['#smart-phone-debug-container>#excute-sugarcube-path'], ['#smart-phone-debug-container>#excute-sugarcube']]
  },
  roles: [{role: 'page-shell', selectors: [':scope>#smart-phone-debug-container']}]
 };
 let owner: Partial<UiApi> | null | undefined = null;
 let handle: Readonly<AdapterHandle> | null = null, debug: Readonly<AdapterHandle> | null = null, reason = 'runtime-unavailable';
 function attach() {
  const ui = window.DoLGameUI?.ui;
  if (owner === ui) return;
  handle?.destroy(); debug?.destroy(); owner = ui; handle = debug = null; reason = ui ? 'runtime-api-unsupported' : 'runtime-unavailable';
  if (ui?.apiVersion !== 1 || typeof ui.getCapabilities !== 'function' || typeof ui.registerStyleAdapter !== 'function') return;
  try {if (!ui.getCapabilities().styleAdapters) {reason = 'style-adapter-unavailable'; return}} catch {reason = 'runtime-capability-failed'; return}
  try {handle = ui.registerStyleAdapter(spec); debug = ui.registerStyleAdapter(debugSpec)} catch {reason = 'registration-failed'}
 }
 document.addEventListener('dol-ui-runtime-ready', attach);
 window.SmartPhoneSoftWet = Object.freeze({
  getDiagnostics: () => handle ? Object.freeze({...handle.getDiagnostics(), components: {debug: debug?.getDiagnostics()}}) : Object.freeze({status: 'inactive', reason}),
  destroy() {document.removeEventListener('dol-ui-runtime-ready', attach); handle?.destroy(); debug?.destroy(); handle = debug = null; owner = null; delete window.SmartPhoneSoftWet}
 });
 attach();
})();
