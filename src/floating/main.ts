import {visualScope} from '../ui/visual-scope';
import {createApp,reactive,nextTick,type App} from 'vue';
import FloatingTools from './FloatingTools.vue';
import {floatingDefaults,floatingKey,readFloatingPreferences,displayPosition,positionIntent,ballSize,edge,toolIds,type FloatingPreferences,type ToolId,type Viewport} from './preferences';
import {isMasterEnabled} from '../runtime/master';
import {mountUI,unmountUI} from '../runtime/presentation';
import './style.css';
type Tool={id:ToolId;name:string;icon:string;description:string;reason:string};
export type FloatingState={x:number;y:number;intentX:number;intentY:number;open:boolean;mode:'fan'|'grid';config:boolean;dragging:boolean;tools:Tool[];fan:{x:number;y:number}[];menuX:number;menuY:number;menuWidth:number;menuMaxHeight:number;message:string};
import type {FloatingApi} from './preferences';
export type {FloatingApi} from './preferences';
type Root=Window & {DoLFloatingTools?:FloatingApi;DoLMidnightTheme?:{openSettings():void};DoLGameUI?:{openSettings():void;ui?:{openInspector?:()=>unknown}}};
export function startFloatingTools(root:Root=window,renderSurface=true){
 if(root.DoLFloatingTools)return root.DoLFloatingTools;
 let p:FloatingPreferences;try{p=readFloatingPreferences(root.localStorage.getItem(floatingKey))}catch{p={...floatingDefaults,tools:[...toolIds]}}
 const state=reactive<FloatingState>({x:0,y:0,intentX:p.x,intentY:p.y,open:false,mode:p.mode,config:false,dragging:false,tools:[],fan:[],menuX:0,menuY:0,menuWidth:280,menuMaxHeight:600,message:''});
 const scope=visualScope();let liveScope=scope,releaseLive=()=>{};
 let host:HTMLElement|undefined,app:App|undefined,observer:MutationObserver|undefined,sizeObserver:ResizeObserver|undefined,locked=false,blocked=false,outsideAttached=false,watching=false,masterListening=false;
 let menuPress:{id:number;target:HTMLElement}|undefined,menuSuppressClick=false;
 let gesture:{id:number;button:HTMLElement;startX:number;startY:number;x:number;y:number;timer:(()=>void)|undefined;drag:boolean;abandoned:boolean}|undefined,suppressClick=false;
 function viewport():Viewport{
  const v=root.visualViewport,s=host?getComputedStyle(host):undefined;
  const inset=(side:string)=>parseFloat(s?.getPropertyValue('padding-'+side)||'0')||0;
  const left=(v?.offsetLeft??0)+inset('left'),top=(v?.offsetTop??0)+inset('top');
  return{left,top,width:Math.max(ballSize+edge*2,(v?.width??root.innerWidth)-inset('left')-inset('right')),height:Math.max(ballSize+edge*2,(v?.height??root.innerHeight)-inset('top')-inset('bottom'))};
 }
 function tools():Tool[]{return[
  {id:'settings',name:'界面设置',icon:'⚙',description:'打开 Soft & Wet 自有设置',reason:root.DoLGameUI&&root.DoLMidnightTheme?.openSettings?'':'界面设置当前不可用'},
  {id:'inspector',name:'开发检查',icon:'⌕',description:'打开只读 Runtime Inspector',reason:root.DoLGameUI?.ui?.openInspector?'':'当前环境没有可用的开发检查'},
  {id:'move',name:'移动悬浮球',icon:'✥',description:'使用滑块移动，无需长按',reason:''}
 ]}
 function persist(){try{root.localStorage.setItem(floatingKey,JSON.stringify(p))}catch{state.message='位置已应用，但当前环境无法保存。'}document.dispatchEvent(new Event('dol-floating-change'))}
 function position(){
  if(!host||locked||gesture)return;
  const v=viewport(),actual=displayPosition(p,v);state.x=actual.x;state.y=actual.y;state.intentX=p.x;state.intentY=p.y;
  // Keep optional tools above the native action dock without remapping the stored position.
  const dock=document.querySelector('.dcu-footer,#dol-story-actions')?.getBoundingClientRect();
  const heightAvailable=dock&&dock.height>0&&dock.bottom>=v.top+v.height-2&&dock.top>v.top?dock.top-v.top-edge:v.height;
  if(dock&&state.x<dock.right&&state.x+ballSize>dock.left&&state.y<dock.bottom&&state.y+ballSize>dock.top)state.y=Math.max(v.top+edge,dock.top-ballSize-edge);
  state.menuWidth=Math.min(state.config?300:280,v.width-edge*2);state.menuMaxHeight=Math.max(44,heightAvailable-edge*2);
  const desiredHeight=state.mode==='fan'&&!state.config?210:host.querySelector('.dsf-menu')?.getBoundingClientRect().height||180;
  const height=Math.min(desiredHeight,state.menuMaxHeight),above=state.y-v.top>=height+edge,below=state.y+ballSize+height+edge<=v.top+heightAvailable;
  if(state.open&&state.mode==='fan'&&!above&&!below){state.mode='grid';state.tools=tools();state.message='当前窗口空间较小，临时使用网格。';void nextTick(position);return}
  const x=Math.max(v.left+edge,Math.min(v.left+v.width-state.menuWidth-edge,state.x+ballSize/2-state.menuWidth/2));
  const y=Math.max(v.top+edge,Math.min(v.top+heightAvailable-height-edge,above?state.y-height-edge:state.y+ballSize+edge));
  state.menuX=x-state.x;state.menuY=y-state.y;
  state.fan=[{x:0,y:above?70:20},{x:(state.menuWidth-92)/2,y:above?0:75},{x:state.menuWidth-92,y:above?70:20}];
 }
 function outside(event:PointerEvent){if(!host?.contains(event.target as Node))close(false)}
 function close(focus=true){unlock();const hadFocus=host?.contains(document.activeElement);state.open=false;state.config=false;state.message='';locked=false;if(outsideAttached){document.removeEventListener('pointerdown',outside);outsideAttached=false}if(focus&&hadFocus)host?.querySelector<HTMLButtonElement>('.dsf-ball')?.focus({preventScroll:true});position()}
 function open(mode=p.mode){menuSuppressClick=false;state.mode=mode;state.tools=tools().filter(t=>mode==='grid'||p.tools.includes(t.id));state.config=false;state.message='';state.open=true;if(!outsideAttached){document.addEventListener('pointerdown',outside);outsideAttached=true}position();void nextTick(position)}
 function toggle(event:MouseEvent){if(event.detail>0&&suppressClick){suppressClick=false;return}if(state.open)close();else open()}
 function finish(cancelled:boolean){
  const g=gesture;if(!g)return;gesture=undefined;g.timer?.();state.dragging=false;
  if(g.drag&&!cancelled){const intent=positionIntent(state.x,state.y,viewport());p.x=intent.x;p.y=intent.y;persist()}
  if(g.drag||g.abandoned||cancelled)suppressClick=true;
  try{if(g.button.hasPointerCapture(g.id))g.button.releasePointerCapture(g.id)}catch{/* Already cancelled by the browser. */}
  position();
 }
 function down(event:PointerEvent){if(event.button!==0||!event.isPrimary||gesture)return;suppressClick=false;const button=event.currentTarget as HTMLElement;const g={id:event.pointerId,button,startX:event.clientX,startY:event.clientY,x:state.x,y:state.y,timer:undefined as (()=>void)|undefined,drag:false,abandoned:false};gesture=g;
  try{button.setPointerCapture(event.pointerId)}catch{gesture=undefined;return}
  g.timer=liveScope.timeout(()=>{if(gesture!==g||g.abandoned)return;close(false);g.drag=true;state.dragging=true},450);
 }
 function move(event:PointerEvent){const g=gesture;if(!g||g.id!==event.pointerId)return;const dx=event.clientX-g.startX,dy=event.clientY-g.startY;if(!g.drag){if(Math.hypot(dx,dy)>8){g.abandoned=true;g.timer?.()}return}const v=viewport();state.x=Math.max(v.left+edge,Math.min(v.left+v.width-ballSize-edge,g.x+dx));state.y=Math.max(v.top+edge,Math.min(v.top+v.height-ballSize-edge,g.y+dy))}
 function up(event:PointerEvent){if(gesture?.id===event.pointerId)finish(false)}
 function configure(){state.mode='grid';state.tools=tools();state.config=true;state.open=true;void nextTick(position)}
 function run(id:ToolId){const tool=tools().find(t=>t.id===id);if(!tool)return;if(tool.reason){open('grid');state.message=tool.reason;return}if(id==='move'){configure();return}close(false);try{if(id==='settings')root.DoLGameUI?.openSettings();else root.DoLGameUI?.ui?.openInspector?.()}catch{open('grid');state.message='这个工具暂时无法打开，请从界面设置重试。'}}
 function lock(event:PointerEvent){
  if(event.button!==0||!event.isPrimary||menuPress)return;
  const target=(event.target as Element).closest<HTMLElement>('button,input')??event.currentTarget as HTMLElement;
  menuSuppressClick=false;try{target.setPointerCapture(event.pointerId)}catch{return}
  menuPress={id:event.pointerId,target};locked=true;
 }
 function unlock(event?:PointerEvent){
  const press=menuPress;if(!press||event&&event.pointerId!==press.id)return;menuPress=undefined;
  const r=press.target.getBoundingClientRect();menuSuppressClick=!event||event.type!=='pointerup'||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;
  try{if(press.target.hasPointerCapture(press.id))press.target.releasePointerCapture(press.id)}catch{/* Browser already released it. */}
  locked=false;schedule();
 }
 function guard(event:MouseEvent){if(menuSuppressClick&&event.detail>0){menuSuppressClick=false;event.preventDefault();event.stopImmediatePropagation()}}
 function setPreference(key:keyof FloatingPreferences,value:unknown){if(!Object.hasOwn(p,key))return;if((key==='enabled'||key==='hidden')&&typeof value!=='boolean')return;if((key==='x'||key==='y')&&(typeof value!=='number'||!Number.isFinite(value)))return;if(key==='mode'&&value!=='fan'&&value!=='grid')return;if(key==='tools'&&!Array.isArray(value))return;const next=readFloatingPreferences(JSON.stringify({...p,[key]:value}));p=next;persist();if(state.open)close(false);refresh()}
 function setPosition(axis:'x'|'y',value:number){if(!Number.isFinite(value))return;p[axis]=Math.max(0,Math.min(1,value));state.intentX=p.x;state.intentY=p.y;persist();position()}
 function listen(target:EventTarget,type:string,callback:EventListener){target.addEventListener(type,callback);liveScope.own(()=>target.removeEventListener(type,callback))}
 function resize(){if(gesture)finish(true);position()}
 function release(){finish(true);close(false);scope.cancelFrame(update);releaseLive();sizeObserver=undefined;unmountUI(app);app=undefined;host?.remove();host=undefined}
 function modalVisible(){return [...document.querySelectorAll('dialog[open],#customOverlay,#ui-dialog')].some(e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none')}
 function refresh(){
  if(!scope.active())return;blocked=modalVisible();
  const wanted=renderSurface&&p.enabled&&!p.hidden;
  if(wanted&&!masterListening){document.addEventListener('dol-ui-master-change',schedule);masterListening=true}else if(!wanted&&masterListening){document.removeEventListener('dol-ui-master-change',schedule);masterListening=false}
  if(wanted&&isMasterEnabled()&&!watching&&document.body){observer?.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open']});watching=true}else if((!wanted||!isMasterEnabled())&&watching){observer?.disconnect();watching=false}
  const visible=isMasterEnabled()&&wanted&&!blocked;
  if(!visible){if(host)release();return}
  if(host?.isConnected){position();return}
  if(host)release();if(!document.body)return;if(document.getElementById('dol-stone-free-floating'))return;
  liveScope=visualScope();const mountedScope=liveScope;releaseLive=scope.own(()=>mountedScope.dispose());host=document.createElement('div');host.id='dol-stone-free-floating';document.body.append(host);
  app=createApp(FloatingTools,{state,toggle,down,move,up,cancel:()=>finish(true),run,grid:()=>open('grid'),close:()=>close(),configure,hide:()=>api.hide(),position:setPosition,lock,unlock,guard});
  try{mountUI(app,host,()=>{p.enabled=false;release();document.dispatchEvent(new Event('dol-floating-change'))})}catch{p.enabled=false;release();return}
  listen(root,'resize',resize);listen(root,'blur',()=>{finish(true);unlock()});if(root.visualViewport){listen(root.visualViewport,'resize',resize);listen(root.visualViewport,'scroll',resize)}
  if(typeof ResizeObserver==='function'){const mounted=liveScope;sizeObserver=new ResizeObserver(()=>{if(mounted.active())position()});const resize=sizeObserver;mounted.own(()=>resize.disconnect());resize.observe(host)}
  position();
 }
 function update(){blocked=modalVisible();refresh()}
 function schedule(){scope.frame(update)}
 const api:FloatingApi={getPreferences:()=>({...p,tools:[...p.tools]}),setPreference,show(){p.enabled=true;p.hidden=false;persist();refresh()},hide(){p.hidden=true;persist();refresh()},resetPosition(){p.x=floatingDefaults.x;p.y=floatingDefaults.y;persist();refresh();document.dispatchEvent(new Event('dol-floating-reset'))},refresh,destroy(){if(!scope.active())return;scope.dispose();document.removeEventListener('dol-ui-master-change',schedule);document.removeEventListener('DOMContentLoaded',schedule);release();delete root.DoLFloatingTools}};
 root.DoLFloatingTools=api;
 observer=new MutationObserver(schedule);scope.own(()=>observer?.disconnect());if(!document.body)document.addEventListener('DOMContentLoaded',schedule,{once:true});blocked=modalVisible();refresh();document.dispatchEvent(new Event('dol-floating-change'));
 return api;
}
