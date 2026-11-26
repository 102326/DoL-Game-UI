import type {MaterialMode, MountContext, SurfacePreset} from '../contracts';

/** Mount into a caller-owned positioned stacking context. Never changes the parent. */
function resolve(mode:MaterialMode,css?:Pick<typeof CSS,'supports'>):MaterialMode {
 return mode==='acrylic' && !!(css?.supports?.('backdrop-filter','blur(1px)') || css?.supports?.('-webkit-backdrop-filter','blur(1px)'))?'acrylic':'static';
}
function setup(mode: MaterialMode) {return ({element}: MountContext) => {
 const acrylic=resolve(mode,element.ownerDocument.defaultView?.CSS)==='acrylic';
 element.setAttribute('aria-hidden','true');
 element.inert = true;
 Object.assign(element.style,{
  position:'absolute', inset:'0', zIndex:'-1', borderRadius:'inherit',
  pointerEvents:'none', backgroundColor:acrylic?'var(--sf-scrim-tint, rgba(30,34,40,.36))':'var(--sf-scrim-static, #1e2228)',
 });
 if(acrylic){
  element.style.backdropFilter='blur(var(--sf-scrim-blur, 4px))';
  element.style.setProperty('-webkit-backdrop-filter','blur(var(--sf-scrim-blur, 4px))');
 }
}}
export const surface:Readonly<SurfacePreset>=Object.freeze({resolve,setup});

/** Legacy experimental recipe retained for existing hosts. */
export const acrylicScrim=setup('acrylic');
