import {rewriteModHubRules} from './modhub-rule-patch';

declare const __SW_MODHUB_RULE_HELPER__: string;
const targetSha = '4082ed4ba8e0d3d64035bf24bcf34376f70572ba0f4cefcce26f9cb0c7e3a648';
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';

async function afterModLoad(_boot: unknown, _zip: unknown, info: unknown): Promise<void> {
  if (!isRecord(info) || info.name !== 'ModHub' || info.version !== '1.9.2' || !isRecord(info.cache)) return;
  const cache = info.cache.scriptFileItems;
  if (!isRecord(cache) || !Array.isArray(cache.items) || !(cache.map instanceof Map)) return;
  const matches: unknown[] = cache.items.filter((item: unknown) => isRecord(item) && item.name === 'javascript/modhub-market.js');
  const item = matches[0];
  if (matches.length !== 1 || !isRecord(item) || typeof item.content !== 'string' || cache.map.get(item.name) !== item) return;
  const original = item.content;
  try {
    if (!globalThis.crypto?.subtle) return;
    const bytes = new TextEncoder().encode(original);
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== targetSha || item.content !== original || info.cache.scriptFileItems !== cache || cache.map.get(item.name) !== item || !cache.items.includes(item)) return;
    const rewritten = rewriteModHubRules(original, __SW_MODHUB_RULE_HELPER__);
    if (rewritten) item.content = rewritten;
  } catch (error) {
    console.warn('[Soft & Wet] ModHub rule cache skipped; upstream source retained.', error);
  }
}

// ModLoader explicitly permits source-cache edits here, before normal script execution.
try {
  const manager: unknown = Reflect.get(window, 'modSC2DataManager');
  if (isRecord(manager) && typeof manager.getModLoadController === 'function') {
    const controller: unknown = manager.getModLoadController();
    if (isRecord(controller) && typeof controller.addLifeTimeCircleHook === 'function') {
      controller.addLifeTimeCircleHook('DoLGameUI.ModHubDependencyRules', {afterModLoad});
    }
  }
} catch (error) {
  console.warn('[Soft & Wet] ModHub rule cache unavailable; upstream loader retained.', error);
}
