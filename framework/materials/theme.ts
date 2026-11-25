import type {Host} from '../contracts';
import {appearancePalette,colorDefaults,materialSurfaces,readColors,type ColorRole} from './palette';
type Colors=Partial<Record<ColorRole,string>>;

const slate=Object.freeze({background:'#12171c',panel:'#222d37',text:'#e4ecf1',accent:'#8ec0d8',muted:'#8da0ae'});
const graphite=Object.freeze({...colorDefaults});
export const themePresets=Object.freeze({graphite,slate});
function preview(colors:Colors){
 const input=readColors(colors);
 const {palette,adjusted}=appearancePalette(input);
 return Object.freeze({active:Object.keys(input).length>0,adjusted,palette:Object.freeze({
  ...palette,detail:palette.muted,error:'#ffb0b0',
  ...materialSurfaces(palette.background,palette.panel),
  shell:palette.background,floating:palette.panel,
 })});
}
export interface ThemeCapability {
 readonly presets:typeof themePresets;
 readonly current:ReturnType<typeof preview>;
 preview:typeof preview;
 apply(colors:Colors):void;
}
export function createTheme(host:Host,doc:Document){
 let current=preview({});
 let published=false;
 const api=Object.freeze({presets:themePresets,preview,get current(){return current},apply(colors:Colors){
  if(host.getDiagnostics().disposed)return;
  current=preview(colors);
  doc.dispatchEvent(new Event('host5-theme-applied'));
 }});
 function activate():Readonly<ThemeCapability>{
  if(!published){
   const owner=host.register('HostThemeLab');
   published=true;
   owner.provide({id:'current',schema:'host5.theme',read:()=>current.palette});
  }
  return api;
 }
 return {activate};
}
