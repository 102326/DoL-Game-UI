import {watch,onBeforeUnmount,type Ref} from 'vue';

/** Internal presentation leases, not a Host or third-party registration protocol. */
export type WorkspaceRole='saves'|'wardrobe'|'shop'|'combat'|'save-detail'|'reference'|'drawer';
type Surface={id:string;parent:HTMLElement;header:HTMLElement;role:WorkspaceRole;modalOnly:boolean};
const surfaces=new Map<HTMLElement,Surface>(),listeners=new Set<()=>void>();let sequence=0;
const notify=()=>{for(const listener of listeners)try{listener()}catch(error){console.warn('Workspace presentation listener failed',error)}};
export const workspaceSurfaces=()=>[...surfaces.values()];
export function observeWorkspaceSurfaces(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener)}}
export function registerWorkspaceSurface(parent:HTMLElement,header:HTMLElement,role:WorkspaceRole,modalOnly=false){
 const previous=parent.getAttribute('data-sf-workspace'),surface:Surface={id:'workspace-'+(++sequence),parent,header,role,modalOnly};
 if(surfaces.has(parent))throw Error('Workspace presentation already leased');
 let observer:MutationObserver|undefined;
 try{
  // A closed native dialog must wake on showModal, without allocating hidden weather.
  if(parent instanceof HTMLDialogElement){observer=new MutationObserver(notify);observer.observe(parent,{attributes:true,attributeFilter:['open','class']})}
  parent.setAttribute('data-sf-workspace',role);surfaces.set(parent,surface);
 }catch(error){observer?.disconnect();throw error}
 notify();let released=false;
 return()=>{if(released)return;released=true;observer?.disconnect();if(surfaces.get(parent)!==surface)return;surfaces.delete(parent);if(parent.getAttribute('data-sf-workspace')===role){if(previous===null)parent.removeAttribute('data-sf-workspace');else parent.setAttribute('data-sf-workspace',previous)}notify()};
}
export function useWorkspaceSurface(target:Ref<HTMLElement|null|undefined>,role:WorkspaceRole,parentFor:(node:HTMLElement)=>HTMLElement|undefined=node=>node,modalOnly=false){
 let release:(()=>void)|undefined;
 const stop=watch(target,node=>{release?.();release=undefined;if(node){const parent=parentFor(node);if(parent)release=registerWorkspaceSurface(parent,parent.querySelector<HTMLElement>(':scope>header')??node,role,modalOnly)}},{flush:'post',immediate:true});
 onBeforeUnmount(()=>{stop();release?.();release=undefined});
}
