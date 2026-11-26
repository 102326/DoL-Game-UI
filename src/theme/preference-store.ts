import {createPagePreferences} from './page-preferences';
import {initMaster} from '../runtime/master';
import {reactive} from 'vue';
import {defaults, readingRanges, type PreferenceKey, type Preferences} from './preferences';
import {emptyAppearance, readAppearance, retiredPreset} from './appearance';

const KEY = 'DoLMidnightTheme.preferences.v1';
const retiredKeys = new Set<PreferenceKey>([
 'statusPreview', 'startupCacheLazy', 'storyActions', 'compactStats', 'comfortable', 'wideReading',
]);

const numericRanges = {
 ...readingRanges,
 fontScale: {min: 50, max: 150},
 buttonScale: {min: 50, max: 150},
 acrylicTransparency: {min: 0, max: 100},
};

/** Stored values and live requests follow the same rules. Callers own persistence and effects. */
export function writePreference(preferences: Preferences, key: PreferenceKey, value: unknown): boolean {
 if (retiredKeys.has(key)) return false;
 switch (key) {
  case 'visualTier':
   if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2) return false;
   preferences[key] = value;
   break;
  case 'readingLineScale':
  case 'readingBlockGap':
  case 'readingWidth':
  case 'fontScale':
  case 'buttonScale':
  case 'acrylicTransparency': {
   if (typeof value !== 'number' || !Number.isFinite(value)) return false;
   const range = numericRanges[key];
   preferences[key] = Math.max(range.min, Math.min(range.max, Math.round(value)));
   break;
  }
  default:
   if (typeof value !== 'boolean') return false;
   preferences[key] = value;
 }
 return true;
}

/** One snapshot and one writer for the existing theme storage envelope. */
export function startThemePreferences(root: Window) {
 const model = reactive({preferences: {...defaults}, appearance: emptyAppearance()});
 const {preferences} = model;
 let storageError = false;
 function save() {
  try {
   root.localStorage.setItem(KEY, JSON.stringify({...preferences, appearance: model.appearance, _scaleBaseline26: true, _readingBaseline41: true}));
   storageError = false;
  } catch { storageError = true }
  return !storageError;
 }
 // Store the migration marker with its values so a partial write cannot reset later choices.
 try{
  const raw=root.localStorage.getItem(KEY);
  if(raw&&raw.length>2048)throw Error('Invalid preference length');
  const value=raw?JSON.parse(raw) as (Partial<Record<PreferenceKey,unknown>> & {appearance?:unknown;_scaleBaseline26?:unknown;_readingBaseline41?:unknown}) | null:null;
  model.appearance = readAppearance(value?.appearance);
  for(const key of Object.keys(defaults) as PreferenceKey[]){
   writePreference(preferences,key,value?.[key]);
  }
  const retiredEnabled = [...retiredKeys].some(key => value?.[key] === true);
  if(value?._scaleBaseline26!==true){
   preferences.fontScale=100;preferences.buttonScale=100;
  }
  if(value?._scaleBaseline26!==true||value?._readingBaseline41!==true||retiredEnabled)save();
  else if(value && retiredPreset(value.appearance)){
   root.localStorage.setItem(KEY,JSON.stringify({...value,appearance:model.appearance}));
  }
 }catch{storageError=true}
 initMaster(preferences);
 return {model, pages:createPagePreferences(root), save, get storageError() { return storageError }};
}
