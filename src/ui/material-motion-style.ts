// Bounded identity for our two inline transform writes. Never suppress unrelated style changes.
const writes=new WeakMap<HTMLElement,{before:(string|null)[];after:string|null}>();
export function writeMaterialTransform(node:HTMLElement,translate:string,scale:string){
 const before=[node.getAttribute('style')];node.style.translate=translate;
 before.push(node.getAttribute('style'));node.style.scale=scale;
 writes.set(node,{before,after:node.getAttribute('style')});
}
export function isMaterialTransformMutation(record:MutationRecord){
 if(record.type!=='attributes'||record.attributeName!=='style'||!(record.target instanceof HTMLElement)||!record.target.hasAttribute('data-dgu-material-moving'))return false;
 const written=writes.get(record.target);return !!written&&written.before.includes(record.oldValue)&&record.target.getAttribute('style')===written.after;
}
export function clearMaterialTransform(node:HTMLElement){writes.delete(node)}
