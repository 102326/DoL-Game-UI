import type {Host} from '../contracts';
import {appearancePalette,colorDefaults,lightDesigns,materialSurfaces,readColors,type ColorRole,type ThemeMode} from './palette';
type Colors=Partial<Record<ColorRole,string>>;

const slate=Object.freeze({background:'#12171c',panel:'#222d37',text:'#e4ecf1',accent:'#8ec0d8',muted:'#8da0ae'});
const graphite=Object.freeze({...colorDefaults});
const mist=Object.freeze(lightDesigns.mist.colors);
const porcelain=Object.freeze(lightDesigns.porcelain.colors);
export const themePresets=Object.freeze({graphite,slate,mist,porcelain});
function preview(colors:Colors,mode?:ThemeMode){
 // Direct users can pass a Host preset. Persisted plain colors require an explicit mode.
 if(colors===mist) mode='mist';
 if(colors===porcelain) mode='porcelain';
 mode=mode==='mist'||mode==='porcelain'?mode:undefined;
 const design=mode&&lightDesigns[mode];
 const input=readColors(colors);
 const {palette,adjusted}=appearancePalette(input,mode);
 const surfaces=design && palette.background===design.colors.background && palette.panel===design.colors.panel
  ? {canvas:palette.background,rail:design.rail,reading:design.reading,well:design.well}
  : materialSurfaces(palette.background,palette.panel,mode);
 return Object.freeze({active:!!mode||Object.keys(input).length>0,adjusted,mode,glassMin:design?.glassMin,palette:Object.freeze({
  ...palette,...surfaces,detail:palette.muted,
  shell:mode?palette.panel:palette.background,floating:palette.panel,
 })});
}
export interface ThemeCapability {
 readonly presets:typeof themePresets;
 readonly current:ReturnType<typeof preview>;
 preview:typeof preview;
 apply(colors:Colors,mode?:ThemeMode):void;
}
export function createTheme(host:Host,doc:Document){
 let current=preview({});
 let published=false;
 const api=Object.freeze({presets:themePresets,preview,get current(){return current},apply(colors:Colors,mode?:ThemeMode){
  if(host.getDiagnostics().disposed)return;
  current=preview(colors,mode);
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
