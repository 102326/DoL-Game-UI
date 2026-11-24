import type {Host} from '../contracts';
import {appearancePalette,readAppearance,type Appearance} from '../../src/theme/appearance';

const slate=Object.freeze({background:'#202732',panel:'#202732',accent:'#92bad5',muted:'#d4b795'});
const graphite=Object.freeze({background:'#242426',panel:'#242426',accent:'#c9c9cd',muted:'#bcab95'});
export const themePresets=Object.freeze({graphite,slate});
export function resolveTheme(colors:Appearance['colors']){
 const {palette}=appearancePalette(colors);
 return {...palette,detail:palette.muted,error:'#ffb0b0'};
}
export interface ThemeCapability {readonly presets:typeof themePresets;apply(colors:Appearance['colors']):void}
export function createTheme(host:Host,doc:Document){
 let current=resolveTheme({});
 let published=false;
 const api=Object.freeze({presets:themePresets,apply(colors:Appearance['colors']){
  if(host.getDiagnostics().disposed)return;
  current=resolveTheme(readAppearance({colors}).colors);
  doc.dispatchEvent(new Event('host5-theme-applied'));
 }});
 function activate():Readonly<ThemeCapability>{
  if(!published){
   const owner=host.register('HostThemeLab');
   published=true;
   owner.provide({id:'current',schema:'host5.theme',read:()=>current});
  }
  return api;
 }
 return {activate};
}
