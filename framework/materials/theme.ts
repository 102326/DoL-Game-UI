import type {Host} from '../contracts';
import {appearancePalette,readingSurface,readColors,type ColorRole} from './palette';
type Colors=Partial<Record<ColorRole,string>>;

const slate=Object.freeze({background:'#202732',panel:'#202732',accent:'#92bad5',muted:'#d4b795'});
const graphite=Object.freeze({background:'#242426',panel:'#242426',accent:'#c9c9cd',muted:'#bcab95'});
export const themePresets=Object.freeze({graphite,slate});
function preview(colors:Colors){
 const input=readColors(colors);
 const {palette,adjusted}=appearancePalette(input);
 return Object.freeze({active:Object.keys(input).length>0,adjusted,palette:Object.freeze({
  ...palette,detail:palette.muted,error:'#ffb0b0',
  canvas:palette.background,rail:palette.background,reading:readingSurface(palette.panel,palette.text),
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
