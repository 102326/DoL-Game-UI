import {isolate} from '../runtime/presentation';
import type {PanelKind} from '../panels/types';

export const pageModules = {
 saves:'DoLSavesUI', shop:'DoLShopUI', combat:'DoLCombatUI',
 wardrobe:'DoLWardrobeUI', characteristics:'DoLCharacteristicsUI', social:'DoLSocialUI',
} as const;
type SinglePage = keyof typeof pageModules;
export type PageKey = SinglePage | PanelKind;
export const panelKeys = ['journal','traits','statistics','feats','cheats','attitudes','settings'] as const satisfies readonly PanelKind[];
export const pageKeys: readonly PageKey[] = [...Object.keys(pageModules) as SinglePage[], ...panelKeys];
export type RequestedPages = Record<`${PageKey}Enabled`, boolean>;

function storageKey(page: PageKey) {
 if (page === 'combat') return 'DoLCombatUI.enabled.v1';
 if (page === 'wardrobe') return 'DoLGameUI.wardrobe.v1';
 return `DoLGameUI.${page}.enabled`;
}

/** Keep existing per-page keys. Cache only accepted user requests, including session-only choices. */
export function createPagePreferences(root: {localStorage: Pick<Storage,'getItem'|'setItem'>}) {
 const values = new Map<PageKey, boolean>();
 const unsaved = new Set<PageKey>();
 return {
  get(page: PageKey) {
   const cached = values.get(page);
   if (cached !== undefined) return cached;
   let value = true;
   try { value = root.localStorage.getItem(storageKey(page)) !== 'false' } catch { /* Session default. */ }
   values.set(page, value);
   return value;
  },
  set(page: PageKey, value: boolean) {
   values.set(page, value);
   try {
    root.localStorage.setItem(storageKey(page), String(value));
    unsaved.delete(page);
   } catch { unsaved.add(page) }
  },
  isUnsaved(page: PageKey) { return unsaved.has(page) },
 };
}
export type PagePreferences = ReturnType<typeof createPagePreferences>;

type Controls = {getEnabled():boolean; setEnabled(value:boolean):void; isBusy?():boolean};
type RuntimePages = Partial<Record<typeof pageModules[SinglePage], Controls>> & {
 DoLPanelsUI?: {getEnabled(page:PanelKind):boolean;setEnabled(page:PanelKind,value:boolean):void};
};
const isSingle = (page: PageKey): page is SinglePage => Object.hasOwn(pageModules, page);

export function pageEnabled(root: RuntimePages, page: PageKey) {
 return isSingle(page) ? root[pageModules[page]]?.getEnabled() : root.DoLPanelsUI?.getEnabled(page);
}
export function requestPage(root: RuntimePages, page: PageKey, value: boolean) {
 if (page === 'wardrobe' && root.DoLWardrobeUI?.isBusy?.()) {
  document.dispatchEvent(new Event('dol-ui-wardrobe-change'));
  return;
 }
 if (isSingle(page)) root[pageModules[page]]?.setEnabled(value);
 else root.DoLPanelsUI?.setEnabled(page, value);
}

/** Refresh in the same order on normal master changes and on emergency recovery. */
export function refreshPages(root: Partial<Record<keyof RuntimePages, {refresh?():void}>>) {
 for (const name of ['DoLSavesUI','DoLShopUI','DoLPanelsUI','DoLSocialUI','DoLCharacteristicsUI','DoLWardrobeUI','DoLCombatUI'] as const) {
  isolate(name, () => root[name]?.refresh?.());
 }
}
