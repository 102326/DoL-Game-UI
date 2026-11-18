import {reactive} from 'vue';
import {defaults, readingRanges, type PreferenceKey} from './preferences';
import {emptyAppearance, readAppearance} from './appearance';

const KEY = 'DoLMidnightTheme.preferences.v1';
export function preferenceScale(value: unknown) {
 return typeof value === 'number' && Number.isFinite(value)
  ? Math.max(50, Math.min(150, Math.round(value))) : undefined;
}

/** One snapshot and one writer for the existing theme storage envelope. */
export function createThemePreferences(root: Window) {
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
   const v=value?.[key];
   if(key==='readingLineScale'||key==='readingBlockGap'||key==='readingWidth'){if(typeof v==='number'&&Number.isFinite(v)){const range=readingRanges[key];preferences[key]=Math.max(range.min,Math.min(range.max,Math.round(v)))}}
   else if(key==='visualTier'){ if(typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=2)preferences[key]=v}
   else if(key==='acrylicTransparency'){if(typeof v==='number'&&Number.isFinite(v))preferences[key]=Math.max(0,Math.min(100,Math.round(v)))}
   else if(key==='fontScale'||key==='buttonScale'){const scale=preferenceScale(v);if(scale!==undefined)preferences[key]=scale}
   else if(typeof v==='boolean')preferences[key]=v;
  }
  const retiredEnabled=preferences.statusPreview||preferences.startupCacheLazy||preferences.storyActions||preferences.compactStats||preferences.comfortable||preferences.wideReading;
  preferences.statusPreview=false;preferences.startupCacheLazy=false;preferences.storyActions=false;preferences.compactStats=false;preferences.comfortable=false;preferences.wideReading=false;
  if(value?._scaleBaseline26!==true){
   preferences.fontScale=100;preferences.buttonScale=100;
  }
  if(value?._scaleBaseline26!==true||value?._readingBaseline41!==true||retiredEnabled)save();
 }catch{storageError=true}
 return {model, save, get storageError() { return storageError }};
}
