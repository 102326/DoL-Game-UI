export type Point = {x:number;y:number};
export type Bounds = {left:number;top:number;right:number;bottom:number};
export type Wall = 'left'|'right'|'top'|'bottom';
export type Snapshot = {phase:'idle'|'dragging'|'charging'|'flying';wall:Wall|null;charge:number;aim:number;vx:number;vy:number;point:Point;contacts:Point[];bounces:number};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const sane=(n:number,fallback=0)=>Number.isFinite(n)?n:fallback;
const limit=(p:Point,b:Bounds):Point=>({x:clamp(sane(p.x,b.left),b.left,b.right),y:clamp(sane(p.y,b.top),b.top,b.bottom)});
const MAX_AIM=43*Math.PI/180;
const validBounds=(b:Bounds)=>[b.left,b.top,b.right,b.bottom].every(Number.isFinite)&&b.left<=b.right&&b.top<=b.bottom;

export class EdgePhysics {
 private state:Snapshot={phase:'idle',wall:null,charge:0,aim:0,vx:0,vy:0,point:{x:0,y:0},contacts:[],bounces:0};
 private since=0; private tangent=0; private locked=0; private elapsed=0;
 snapshot():Snapshot {return {...this.state,point:{...this.state.point},contacts:this.state.contacts.map(p=>({...p}))}}
 begin(point:Point,bounds:Bounds,now:number):Snapshot {
  if(!validBounds(bounds)||!Number.isFinite(point.x)||!Number.isFinite(point.y))return this.stop();
  this.state={phase:'dragging',wall:null,charge:0,aim:0,vx:0,vy:0,point:limit(point,bounds),contacts:[],bounces:0};
  return this.update(point,bounds,now);
 }
 update(point:Point,bounds:Bounds,now:number):Snapshot {
  if(this.state.phase!=='dragging'&&this.state.phase!=='charging') return this.snapshot();
  if(!validBounds(bounds))return this.stop();
  if(!Number.isFinite(point.x)||!Number.isFinite(point.y)){this.state={...this.state,phase:'dragging',wall:null,charge:0,aim:0};return this.snapshot()}
  const p=point;
  const candidates: [Wall,number][]=[['left',p.x-bounds.left],['right',bounds.right-p.x],['top',p.y-bounds.top],['bottom',bounds.bottom-p.y]];
  candidates.sort((a,b)=>a[1]-b[1]); const active=candidates.find(([wall,distance])=>wall===this.state.wall&&distance < -4); const [wall,distance]=active??candidates[0]!;
  if(distance>=-4){this.state={...this.state,phase:'dragging',wall:null,charge:0,aim:0,point:limit(p,bounds)};return this.snapshot()}
  const tangent=wall==='left'||wall==='right'?p.y:p.x;
  if(this.state.wall!==wall){this.since=sane(now);this.tangent=tangent;this.locked=tangent;this.state.wall=wall;this.state.charge=0;this.state.aim=0}
  const held=Math.max(0,sane(now)-this.since);
  const shown=limit(p,bounds);
  if(held>=180){
   if(this.state.phase!=='charging'){this.locked=wall==='left'||wall==='right'?shown.y:shown.x;this.tangent=tangent}
   const depth=clamp((-distance-4)/34,0,1); const time=clamp((held-180)/820,0,1);
   this.state.phase='charging';this.state.charge=clamp(0.12+0.44*depth+0.44*time,0,1);
   this.state.aim=clamp((tangent-this.tangent)/100,-1,1)*MAX_AIM;
   if(wall==='left'||wall==='right')shown.y=clamp(this.locked,bounds.top,bounds.bottom);else shown.x=clamp(this.locked,bounds.left,bounds.right);
  }else{this.state.phase='dragging';this.state.charge=0;this.state.aim=0}
  this.state.point=shown;return this.snapshot();
 }
 release(_now:number,reducedMotion=false):Snapshot {
  if(this.state.phase==='charging'&&!reducedMotion&&this.state.wall){
   const speed=1600+this.state.charge*1600, n=Math.cos(this.state.aim)*speed, t=Math.sin(this.state.aim)*speed;
   const wall=this.state.wall;
   this.state.vx=wall==='left'?n:wall==='right'?-n:t;
   this.state.vy=wall==='top'?n:wall==='bottom'?-n:t;
   this.state.phase='flying';this.state.contacts=[];this.state.bounces=0;this.elapsed=0;
  }else this.stop();
  return this.snapshot();
 }
 step(dtMs:number,bounds:Bounds):Snapshot {
  if(this.state.phase!=='flying')return this.snapshot();
  if(!validBounds(bounds))return this.stop();
  this.state.contacts=[];
  this.state.point=limit(this.state.point,bounds);
  let remaining=clamp(sane(dtMs),0,8000-this.elapsed);
  while(remaining>0&&this.state.phase==='flying'){
   const ms=Math.min(remaining,4), dt=ms/1000; remaining-=ms;this.elapsed+=ms;
   let x=this.state.point.x+this.state.vx*dt, y=this.state.point.y+this.state.vy*dt;
   const previous=this.state.point, dx=x-previous.x, contacts:{at:number;point:Point}[]=[];
   if(x<bounds.left||x>bounds.right){const edge=clamp(x,bounds.left,bounds.right),at=(edge-previous.x)/(x-previous.x);contacts.push({at,point:{x:edge,y:clamp(previous.y+(y-previous.y)*at,bounds.top,bounds.bottom)}});x=edge;this.state.vx*=-0.9}
   if(y<bounds.top||y>bounds.bottom){const edge=clamp(y,bounds.top,bounds.bottom),at=(edge-previous.y)/(y-previous.y);contacts.push({at,point:{x:clamp(previous.x+dx*at,bounds.left,bounds.right),y:edge}});y=edge;this.state.vy*=-0.9}
   contacts.sort((a,b)=>a.at-b.at);this.state.bounces+=contacts.length;this.state.contacts.push(...contacts.map(contact=>contact.point));
   if(this.state.contacts.length>64)this.state.contacts.splice(0,this.state.contacts.length-64);
   this.state.point={x,y};const damping=Math.exp(-0.55*dt);this.state.vx*=damping;this.state.vy*=damping;
   if(this.elapsed>=8000||Math.hypot(this.state.vx,this.state.vy)<35)this.stop();
  }
  return this.snapshot();
 }
 stop():Snapshot {this.state={...this.state,phase:'idle',wall:null,charge:0,aim:0,vx:0,vy:0,contacts:[]};return this.snapshot()}
}
