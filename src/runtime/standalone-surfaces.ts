import {createSurfaces} from './surfaces';
import surfaceStyles from './surfaces.css?inline';
import type {OpenSurface} from '../public/ui';

export interface StandaloneSurfaces {
 available():boolean;
 openModal:OpenSurface;
 openDrawer:OpenSurface;
 dispose():void;
}
let sequence=0;

/** Explicit, instance-owned presentation only. Importing this module does not start UI. */
export function createStandaloneSurfaces(root:Window):Readonly<StandaloneSurfaces> {
 const doc=root.document;
 if(doc.defaultView!==root)throw new TypeError('Standalone surface requires its document Window');
 const mount=doc.createElement('div'),style=doc.createElement('style');
 do{mount.id=`dgu-standalone-${++sequence}`}while(doc.getElementById(mount.id));
 mount.dataset.dguStandalone='';
 mount.setAttribute('data-dgu-visualGlass','');
 mount.style.cssText='display:contents;--dgu-surface:#202022;--dgu-text:#e6e7eb;--dgu-accent:#c9c9ca;--dgu-secondary:#b6b8c2;--dgu-font-scale:1';
 style.dataset.dguStandaloneStyle=mount.id;
 // Scope the actual shared stylesheet, including its inspector rules and animation name.
 // No html/body flags, copied window implementation or global style registry.
 style.textContent=surfaceStyles.replaceAll('html[data-dol-midnight]',`#${mount.id}`)
  .replaceAll('.dgu-inspector',`#${mount.id} .dgu-inspector`)
  .replaceAll('dgu-surface-in',`${mount.id}-in`);
 mount.append(style);
 let disposed=false;
 const surfaces=createSurfaces(root,()=>!disposed&&style.isConnected&&style.sheet!==null,undefined,mount);
 try{doc.body?.append(mount)}catch(error){mount.remove();throw error}
 return Object.freeze({available:surfaces.available,openModal:surfaces.openModal,openDrawer:surfaces.openDrawer,
  dispose(){if(disposed)return;disposed=true;try{surfaces.destroy()}finally{mount.remove()}}
 });
}
