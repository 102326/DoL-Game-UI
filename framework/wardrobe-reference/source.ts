import {entries, itemColour, itemName, itemWarmth, LABELS, snapshot, type Entry, type Snapshot} from '../../src/wardrobe/data';
import type {WardrobeDataHost} from '../../src/wardrobe/host';

export interface ReferenceItem {key: string; name: string; colour: string; slot: string; warmth: number | null; durability: number | null; lewd: number | null; outfit: string; detail: string}
export interface WardrobeCatalog {passageId: number; categories: readonly {key: string; label: string; items: readonly ReferenceItem[]}[]; unknownSlots: readonly string[]; unavailable?: 'unsupported' | 'no-inventory'}
const passageIds = new WeakMap<Element, number>();let nextPassageId=0;
function passageId(element: Element) {let id=passageIds.get(element);if(!id){id=++nextPassageId;passageIds.set(element,id)}return id}

export function readWardrobe(root: Window): WardrobeCatalog | null {
 try {
  const host = root as WardrobeDataHost, passage = root.document.querySelector<HTMLElement>('#passages .passage:not(.passage-out)');
  const nativePassage = host.SugarCube?.State?.passage ?? host.State?.passage;
  if (!passage || !nativePassage || passage.dataset.passage !== String(nativePassage)) return null;
  if (passage.dataset.passage !== 'Wardrobe') return null;
  const id=passageId(passage);
  if (!passage.contains(root.document.querySelector('#wardrobeList')) || root.document.querySelectorAll('#wardrobeList').length !== 1) return {passageId:id, categories: [], unknownSlots: [], unavailable: 'unsupported'};
  const state: Snapshot | null = snapshot(host);
  if (!state) return {passageId:id, categories: [], unknownSlots: [], unavailable: 'unsupported'};
  const slots = Object.keys(state.inventory).filter(key => Array.isArray((state.inventory as Record<string, unknown>)[key]));
  const categories = slots.filter(key => key in LABELS).map(key => ({key, label: LABELS[key] ?? key, items: entries(state, key).map((entry: Entry) => project(state, entry))}));
  const unknownSlots=slots.filter(key => !(key in LABELS));
  return {passageId:id, categories, unknownSlots, unavailable: !unknownSlots.length && categories.every(category => !category.items.length) ? 'no-inventory' : undefined};
 } catch {return null}
}

function project(state: Snapshot, entry: Entry): ReferenceItem {
 const descriptor = entry.descriptor, raw = entry.raw, max = descriptor?.integrity_max;
 return Object.freeze({
  key: `${entry.slot}:${entry.index}`,
  name: String(itemName(state, entry.slot, raw, descriptor)).slice(0, 100),
  colour: String(itemColour(state, raw)).slice(0, 60),
  slot: LABELS[entry.slot] ?? entry.slot,
  warmth: itemWarmth(state, raw, descriptor),
  durability: Number.isFinite(raw.integrity) && Number.isFinite(max) && max! > 0 ? Math.round(raw.integrity! / max! * 100) : null,
  lewd: Number.isFinite(raw.reveal) ? raw.reveal! : null,
  outfit: raw.outfitPrimary ? '套装' : raw.outfitSecondary ? '套装部件' : '单件',
  detail: String(descriptor?.cn_description ?? descriptor?.description ?? '').slice(0, 240)
 });
}
