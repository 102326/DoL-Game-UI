import {connectSugarCube,type SugarCubeHost} from './sugarcube';
import {STATUS_KEYS,type StatusAPI,type StatusSnapshot} from './status';
const labels={pain:'疼痛',tiredness:'疲劳',stress:'压力',trauma:'创伤',control:'自控'};
/** Opt-in consumer demonstrating the service boundary, not a second game HUD. */
export function startStatusPreview(root:SugarCubeHost & {DoLRuntime?:unknown}){
 let enabled=false,disposed=false,api:StatusAPI|undefined,unsubscribe:(()=>void)|undefined;
 let namespace:{status?:{v1?:unknown}}|undefined,ownsNamespace=false,ownsStatus=false;
 function paint(snapshot?:StatusSnapshot,message?:string){
  const box=document.getElementById('dol-status-preview');if(!box)return;
  box.replaceChildren();box.hidden=!enabled;if(!enabled)return;
  const info=document.createElement('p');info.textContent=message||'只读接口预览 · 原始数值，不代表等级或百分比';box.append(info);
  if(!snapshot)return;
  if(snapshot.status==='loading'||snapshot.status==='unavailable'){info.textContent=snapshot.status==='loading'?'正在读档，等待页面完成后刷新。':'游戏状态尚不可用。';return}
  for(const key of STATUS_KEYS){const row=document.createElement('p');row.textContent=labels[key]+'：'+(snapshot.values[key]===null?'不可用':String(snapshot.values[key]));box.append(row)}
 }
 function release(){
  unsubscribe?.();unsubscribe=undefined;api?.dispose();
  if(api&&namespace?.status?.v1===api)delete namespace.status.v1;
  if(ownsStatus&&namespace?.status&&Object.keys(namespace.status).length===0)delete namespace.status;
  if(ownsNamespace&&root.DoLRuntime===namespace&&Object.keys(namespace!).length===0)delete root.DoLRuntime;
  api=undefined;namespace=undefined;ownsNamespace=false;ownsStatus=false;
 }
 const controls={setEnabled(value:boolean){
  if(disposed)return;
  value=!!value;if(enabled===value&&(!value||api)){if(value)paint(api?.getSnapshot());return}
  enabled=value;if(!value){release();paint();return}
  if(root.DoLRuntime!==undefined&&(!root.DoLRuntime||typeof root.DoLRuntime!=='object')){paint(undefined,'状态接口名称已被其他脚本使用，本次未启用。');return}
  namespace=root.DoLRuntime as typeof namespace;
  if(namespace?.status!==undefined&&(!namespace.status||typeof namespace.status!=='object'||namespace.status.v1!==undefined)){paint(undefined,'已有状态接口，本次未覆盖。');return}
  try{
   if(!namespace){namespace={};root.DoLRuntime=namespace;ownsNamespace=true}
   if(!namespace.status){namespace.status={};ownsStatus=true}
   api=connectSugarCube(root);namespace.status.v1=api;unsubscribe=api.subscribe(paint);paint(api.getSnapshot());
  }catch{release();paint(undefined,'状态接口初始化不可用。')}
 },destroy(){if(disposed)return;disposed=true;enabled=false;release();paint()}};
 return controls;
}
