import {driftingTexture} from './materials/drifting-texture';
import {createTheme} from './materials/theme';
import {createPanelBudget, surfaceMotion} from './motion/panel-budget';
import {surface} from './materials/acrylic-scrim';
import {createHost} from './host';
import {PROTOCOL} from './contracts';

type NativeWindow = Window & Pick<typeof globalThis, 'MutationObserver' | 'HTMLElement'> & {jQuery?: (doc: Document) => {on(events: string, callback: () => void): void; off(namespace: string): void}; SugarCube?:{State?:{passage?:string}}};

export function installHost(root: NativeWindow = window) {
 // Unknown implementations are never replaced or disposed by this package.
 try {if ('DoLUiHost' in root || typeof root.MutationObserver !== 'function' || typeof AbortController !== 'function') return null}
 catch {return null}
 const doc=root.document,panelEffects=createPanelBudget(root),environmentEffects=createPanelBudget(root);
 const ambient=surfaceMotion(environmentEffects);
 const core=createHost(root,{surface,driftingTexture:driftingTexture(environmentEffects)});
 let bridge: ReturnType<NonNullable<NativeWindow['jQuery']>> | undefined, closed = false, retry=0;
 const deadline=Date.now()+30000;
 // Public API availability is separate from a synchronized game scene.
 core.invalidateScene();
 const invalidate=()=>{if(!closed)core.invalidateScene()},ready=()=>{if(!closed)core.sceneReady()};
 function bind() {
  if (closed || bridge) return;
  let candidate:ReturnType<NonNullable<NativeWindow['jQuery']>>|undefined;
  try{
   if(typeof root.jQuery==='function'){
    candidate=root.jQuery(doc);
    candidate.on(':passageinit.stoneFreeHost :onloadsave.stoneFreeHost',invalidate);
    candidate.on(':passageend.stoneFreeHost :storyready.stoneFreeHost',ready);
    bridge=candidate;root.clearTimeout(retry);retry=0;
    const passage=root.SugarCube?.State?.passage;
    if(passage&&doc.querySelector('#passages .passage:not(.passage-out)')?.getAttribute('data-passage')===passage)ready();
   }
  }catch{
   bridge=undefined;
   try{candidate?.off('.stoneFreeHost')}catch{dispose();return}
  }
  if(!closed&&!bridge&&!retry&&Date.now()<deadline)retry=root.setTimeout(()=>{retry=0;bind()},100);
 }
 function dispose() {
  if (closed) return; closed = true;
  root.clearTimeout(retry);doc.removeEventListener('DOMContentLoaded', bind); root.removeEventListener('load', bind);
  try{bridge?.off('.stoneFreeHost')}catch{/* Broken host events must not prevent core disposal. */}
  environmentEffects.dispose(); panelEffects.dispose(); core.dispose(); try {if (root.DoLUiHost === host) delete root.DoLUiHost} catch {}
  doc.dispatchEvent(new Event('stone-free-host-stopped'));
 }
 const themes=createTheme(core,doc);
 const host = Object.freeze({...core,
  get theme(){return closed?undefined:themes.activate()},
  sources(schema:string){
   if(schema==='host5.theme'&&!closed)themes.activate();
   return core.sources(schema);
  },
  panelEffects:surfaceMotion(panelEffects),environmentEffects:ambient,dispose});

 try {root.DoLUiHost = host} catch {environmentEffects.dispose(); panelEffects.dispose(); core.dispose(); return null}
 try {bind();if(closed)return null;doc.addEventListener('DOMContentLoaded', bind); root.addEventListener('load', bind)}
 catch {try {dispose()} catch {} return null}
 doc.dispatchEvent(new CustomEvent('stone-free-host-ready', {detail: {protocolVersion: PROTOCOL}}));
 return Object.freeze({host, dispose});
}

const installation = installHost();
export const dispose = () => installation?.dispose();
