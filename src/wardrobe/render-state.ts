import {RENDER_STATE_FIELDS} from './render-state-fields';
/** Clone all selected branches together, preserving aliases and cycles between them. */
export function copyRenderState(variables:any,full=false):any {
 if(full)return structuredClone(variables);
 const selected:Record<string,unknown>={};
 for(const key of RENDER_STATE_FIELDS){
  if(Object.prototype.hasOwnProperty.call(variables,key))selected[key]=variables[key];
 }
 return structuredClone(selected);
}
