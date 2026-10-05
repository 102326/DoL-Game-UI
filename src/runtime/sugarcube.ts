import {createStatusService,type StatusAPI} from './status';
export type NativeEventsHost=Window & {
 jQuery?:(target:Document|(()=>void))=>{on(events:string,callback:()=>void):unknown;off(events:string,callback?:()=>void):unknown};
};
export type SugarCubeHost=NativeEventsHost & {
 SugarCube?:{State?:{variables?:unknown}};
 State?:{variables?:unknown};
};
/** No Save hooks, history mutation or cached State.variables references. */
export function connectSugarCube(root:SugarCubeHost):StatusAPI {
 const controller=createStatusService({
  readVariables:()=>root.SugarCube?.State?.variables ?? root.State?.variables,
  schedule:callback=>root.requestAnimationFrame(callback),cancel:id=>root.cancelAnimationFrame(id)
 });
 const document=root.document;
 let disposed=false,bound:ReturnType<NonNullable<SugarCubeHost['jQuery']>>|undefined;
 function bind(){
  if(disposed||bound||typeof root.jQuery!=='function')return;
  bound=root.jQuery(document);
  bound.on(':onloadsave.dolStatusV1',controller.beginLoad);
  bound.on(':passageend.dolStatusV1 :storyready.dolStatusV1',controller.renderComplete);
 }
 function ready(){bind();controller.api.refresh()}
 bind();document.addEventListener('DOMContentLoaded',ready,{once:true});
 root.addEventListener('load',ready,{once:true});
 return Object.freeze({...controller.api,
  refresh(){bind();controller.api.refresh()},
  dispose(){if(disposed)return;disposed=true;bound?.off('.dolStatusV1');document.removeEventListener('DOMContentLoaded',ready);root.removeEventListener('load',ready);controller.api.dispose()}
 });
}
