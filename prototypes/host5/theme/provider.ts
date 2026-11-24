import type {Host} from '../../../framework/contracts';
import {appearancePalette} from '../../../src/theme/appearance';

const presets={
 graphite:{base:'#242426',accent:'#c9c9cd',detail:'#bcab95'},
 slate:{base:'#202732',accent:'#92bad5',detail:'#d4b795'},
};
export type Preset=keyof typeof presets;
export function preview(name:Preset){
 const {base,accent,detail}=presets[name];
 const {palette}=appearancePalette({background:base,panel:base,accent,muted:detail});
 return {...palette,detail:palette.muted,error:'#ffb0b0'};
}
export function publishTheme(host:Host){
 const owner=host.register('HostThemeLab');
 let current=preview('graphite');
 owner.provide({id:'current',schema:'host5.theme',read:()=>current});
 return {apply(name:Preset){
  current=preview(name);
  // The fixture signal only invalidates readers. Values come from the Host source.
  document.dispatchEvent(new Event('host5-theme-applied'));
 },dispose:owner.dispose};
}
