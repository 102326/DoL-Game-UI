import type {WardrobeSlotMapping, WardrobeSlotMappingHandle,WardrobeSlotSupport} from '../public/wardrobe';
import {LABELS, type Snapshot} from './data';
import {isMinimumVersion, matchesTargetVersion, type VersionToolsHost} from '../runtime/target-version';

export function createSlotMappings(targetVersion: (name: string) => unknown, versionTools?: VersionToolsHost) {
 const mappings = new Map<string, WardrobeSlotMapping>();
 let disposed = false;
 function register(spec: WardrobeSlotMapping): Readonly<WardrobeSlotMappingHandle> {
  if (disposed) throw Error('Wardrobe disposed');
  if (!spec || typeof spec.id !== 'string' || !/^[A-Za-z][\w-]{0,63}$/.test(spec.id) || mappings.has(spec.id)) throw TypeError('Invalid or duplicate wardrobe mapping id');
  const target = spec.target, pairs = Object.entries(spec.slots ?? {});
  if (!target || typeof target.name !== 'string' || !target.name.trim() || target.name.length > 128 || !Array.isArray(target.versions) || !target.versions.length || target.versions.length > 8 || target.versions.some(v => typeof v !== 'string' || (!/^\d+\.\d+\.\d+[\w.+-]*$/.test(v) && !isMinimumVersion(v)) || v.length > 64)) throw TypeError('Invalid wardrobe mapping target');
  if (!pairs.length || pairs.length > 16 || pairs.some(([slot, label]) => !/^[a-z][a-z_]{0,31}$/.test(slot) || ['__proto__','constructor','prototype'].includes(slot) || Object.hasOwn(LABELS, slot) || typeof label !== 'string' || !label.trim() || label.length > 80)) throw TypeError('Invalid wardrobe slot labels');
  if ([...mappings.values()].some(m => pairs.some(([slot]) => Object.hasOwn(m.slots, slot)))) throw TypeError('Wardrobe slot already mapped');
  // Copy only semantic strings; never capture inventory, descriptors or worn state.
  const saved = {id: spec.id, target: {name: target.name, versions: [...target.versions]}, slots: Object.fromEntries(pairs)};
  mappings.set(saved.id, saved);
  return Object.freeze({destroy() {if (mappings.get(saved.id) === saved) mappings.delete(saved.id)}});
 }
 function labels(s: Snapshot): Record<string, string> {
  const labels: Record<string, string> = {...LABELS, ...(s.variables.debug ? {over_head:'外层头饰', over_upper:'外套', over_lower:'外层下装'} : {})};
  for (const mapping of mappings.values()) {
   if (!matchesTargetVersion(targetVersion(mapping.target.name), mapping.target.versions, versionTools)) continue;
   for (const [slot, label] of Object.entries(mapping.slots)) {
    if (Array.isArray(s.inventory[slot]) && Array.isArray(s.setup.clothes[slot]) && s.setup.clothes[slot].length && s.worn[slot] && typeof s.worn[slot] === 'object') labels[slot] = label;
   }
  }
  return labels;
 }
 function support(s:Snapshot|null):readonly Readonly<WardrobeSlotSupport>[] {
  if(disposed)return Object.freeze([]);
  const result=new Map<string,Readonly<WardrobeSlotSupport>>();
  const add=(slot:string,label:string,mapping:string|null,canDisplay:boolean,operationContract:WardrobeSlotSupport['operationContract'],reason:WardrobeSlotSupport['reason'])=>result.set(slot,Object.freeze({slot,label,mapping,canDisplay,operationContract,reason}));
  if(s)for(const [slot,label] of Object.entries(LABELS))if(Array.isArray(s.inventory[slot]))add(slot,label,null,true,'vanilla','native-slot');
  for(const mapping of mappings.values()){
   const version=targetVersion(mapping.target.name),matches=matchesTargetVersion(version,mapping.target.versions,versionTools);
   for(const [slot,label] of Object.entries(mapping.slots)){
    const complete=!!s&&Array.isArray(s.inventory[slot])&&Array.isArray(s.setup.clothes[slot])&&!!s.setup.clothes[slot].length&&!!s.worn[slot]&&typeof s.worn[slot]==='object';
    const reason=!s?'wardrobe-unavailable':version==null?'target-not-detected':!matches?'unsupported-version':!complete?'missing-native-data':'mapped';
    add(slot,label,mapping.id,reason==='mapped',reason==='mapped'?'author-declared-native':'unreviewed',reason);
   }
  }
  if(s)for(const [slot,value] of Object.entries(s.inventory))if(!result.has(slot)&&/^[a-z][a-z_]{0,31}$/.test(slot)&&Array.isArray(value)&&(Array.isArray(s.setup.clothes[slot])||Object.hasOwn(s.worn,slot)))add(slot,slot,null,false,'unreviewed','registration-required');
  return Object.freeze([...result.values()]);
 }
 return {register, labels, support, destroy() {disposed = true; mappings.clear()}};
}
