import * as Vue from 'vue';

type SharedVue = Readonly<{protocol: '0.1-experimental'; version: string; vue: Readonly<typeof Vue>}>;
declare global {interface Window {StoneFreeVueExperimental?: SharedVue}}

/** Distribution experiment only; Apps, state and cleanup still belong to consumers. */
export function installSharedVue(root: Window = window) {
 if ('StoneFreeVueExperimental' in root) return null;
 const value: SharedVue = Object.freeze({protocol: '0.1-experimental', version: Vue.version, vue: Object.freeze({...Vue})});
 Object.defineProperty(root, 'StoneFreeVueExperimental', {value, configurable: true});
 return Object.freeze({dispose() {
  const current = Object.getOwnPropertyDescriptor(root, 'StoneFreeVueExperimental');
  if (current?.value === value && current.configurable) delete root.StoneFreeVueExperimental;
 }});
}
const installation = installSharedVue();
export const dispose = () => installation?.dispose();
