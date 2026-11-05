// Page-local facade: production consumers run unchanged, but writes use research keys.
import {positionKey as legacyKey} from '../../framework/motion-hub/geometry';
export function isolateStorage(variant:string){
 const original=window.localStorage,descriptor=Object.getOwnPropertyDescriptor(window,'localStorage');
 const prefix=`Evo42.hub.preview.${variant}.`,keys=()=>Object.keys(original).filter(k=>k.startsWith(prefix));
 const snapshot=()=>JSON.stringify(Object.keys(original).filter(k=>!k.startsWith('Evo42.hub.preview.')).sort().map(k=>[k,original.getItem(k)]));
 const before=snapshot(),old=original.getItem(legacyKey);
 if(original.getItem(prefix+legacyKey)===null&&old!==null)original.setItem(prefix+legacyKey,old);
 const storage:Storage={get length(){return keys().length},key(i){return keys()[i]?.slice(prefix.length)??null},getItem(k){return original.getItem(prefix+k)},setItem(k,v){original.setItem(prefix+k,String(v))},removeItem(k){original.removeItem(prefix+k)},clear(){for(const k of keys())original.removeItem(k)}};
 Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
 return {unchanged:()=>snapshot()===before,restore(){if(descriptor)Object.defineProperty(window,'localStorage',descriptor);else Reflect.deleteProperty(window,'localStorage')}};
}
