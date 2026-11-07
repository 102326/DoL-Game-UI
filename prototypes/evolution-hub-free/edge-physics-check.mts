import assert from 'node:assert/strict';
import {EdgePhysics} from './edge-physics.ts';
const b={left:0,top:0,right:300,bottom:200};
const p=()=>new EdgePhysics();
let s=p(); s.begin({x:100,y:100},b,0); s.update({x:0,y:100},b,10); assert.equal(s.release(100).phase,'idle');
s=p(); s.begin({x:0,y:100},b,0); s.update({x:80,y:100},b,200); assert.equal(s.release(400).phase,'idle');
s=p(); s.begin({x:-30,y:100},b,0); s.update({x:-30,y:100},b,300); s.update({x:-30,y:130},b,400); let state=s.release(400); assert.equal(state.phase,'flying'); assert.ok(state.vx>0 && state.vy>0); s.stop(); assert.equal(s.step(16,b).phase,'idle');
s=p(); s.begin({x:330,y:100},b,0); s.update({x:330,y:100},b,400); assert.equal(s.release(400,true).phase,'idle');
function flight(dt:number){const e=p();e.begin({x:150,y:-50},b,0);e.update({x:180,y:-50},b,700);e.release(700);let v=e.step(dt,b);for(let i=0;i<500 && v.phase==='flying';i++)v=e.step(dt,b);return v}
const a=flight(16), c=flight(33); for(const v of [a,c]) {assert.equal(v.phase,'idle');assert.ok(Number.isFinite(v.point.x)&&Number.isFinite(v.point.y));assert.ok(v.point.x>=0&&v.point.x<=300&&v.point.y>=0&&v.point.y<=200)}
assert.ok(Math.hypot(a.point.x-c.point.x,a.point.y-c.point.y)<5);
s=p();s.begin({x:-100,y:50},b,0);s.update({x:-100,y:150},b,10000);state=s.release(10000);assert.ok(Math.hypot(state.vx,state.vy)<=3200);state=s.step(100000,b);assert.equal(state.phase,'idle');
s.begin({x:-20,y:100},b,0);s.update({x:-20,y:100},b,500);s.release(500);assert.equal(s.begin({x:120,y:120},b,600).phase,'dragging');
function charge(x:number, time:number){const e=p();e.begin({x,y:100},b,0);return e.update({x,y:100},b,time).charge}
assert.ok(charge(-60,400)>charge(-10,400)); assert.ok(charge(-10,900)>charge(-10,400));
for(const [start,end,axis,sign] of [[{x:300,y:100},{x:350,y:100},'vx',-1],[{x:150,y:200},{x:150,y:240},'vy',-1]] as const){const e=p();e.begin(end,b,0);e.update(end,b,300);assert.ok(e.release(300)[axis]*sign>0)}
for(const x of [0,-4]) {const e=p();e.begin({x,y:100},b,0);assert.equal(e.update({x,y:100},b,1000).phase,'dragging');assert.equal(e.release(1000).phase,'idle')}
{const e=p();e.begin({x:-5,y:100},b,0);assert.equal(e.update({x:-5,y:100},b,179).phase,'dragging');assert.equal(e.update({x:-5,y:100},b,180).phase,'charging')}
{const e=p();e.begin({x:-80,y:100},b,0);e.update({x:-80,y:100},b,2000);assert.equal(e.update({x:-4,y:100},b,2001).charge,0);assert.equal(e.release(2001).phase,'idle')}
{const e=p();e.begin({x:-30,y:100},b,0);e.update({x:-30,y:100},b,200);const v=e.update({x:-30,y:1000},b,210);assert.ok(Math.abs(v.aim-43*Math.PI/180)<1e-10)}
{const e=p();e.begin({x:-30,y:100},b,0);const before=e.update({x:-30,y:100},b,300);const invalid=e.update({x:NaN,y:Infinity},b,400);assert.deepEqual(invalid.point,before.point);assert.equal(invalid.charge,0);assert.equal(e.release(400).phase,'idle');assert.deepEqual(e.begin({x:Infinity,y:0},b,500).point,before.point)}
{const e=p();const screenBounds={left:12,top:12,right:332,bottom:532};e.begin({x:-26,y:100},screenBounds,0);assert.equal(e.update({x:-26,y:100},screenBounds,1000).charge,1)}

// A fully charged shot crosses a desktop and ricochets repeatedly while losing energy.
{const e=p(), desktop={left:0,top:0,right:1200,bottom:700};e.begin({x:-60,y:350},desktop,0);e.update({x:-60,y:350},desktop,1000);let v=e.release(1000);assert.equal(Math.hypot(v.vx,v.vy),3200);let lastSpeed=Math.hypot(v.vx,v.vy),changes=0,sign=Math.sign(v.vx);for(let i=0;i<500&&v.phase==='flying';i++){v=e.step(16,desktop);const speed=Math.hypot(v.vx,v.vy);assert.ok(speed<=lastSpeed+1e-8);lastSpeed=speed;if(v.phase==='flying'&&Math.sign(v.vx)!==sign){sign=Math.sign(v.vx);changes++}assert.ok(v.point.x>=0&&v.point.x<=1200&&v.point.y>=0&&v.point.y<=700)}assert.ok(changes>=2);assert.equal(v.phase,'idle')}
{const e=p();e.begin({x:-60,y:100},b,0);e.update({x:-60,y:100},b,1000);e.release(1000);const v=e.step(0,{left:20,top:20,right:80,bottom:80});assert.ok(v.point.x>=20&&v.point.x<=80&&v.point.y>=20&&v.point.y<=80);assert.ok(Number.isFinite(v.vx)&&Number.isFinite(v.vy))}
{const e=p();e.begin({x:-60,y:100},b,0);e.update({x:-60,y:100},b,1000);const start=e.release(1000);for(const dt of [NaN,Infinity,-1]){const v=e.step(dt,b);assert.deepEqual(v.point,start.point);assert.ok(Number.isFinite(v.vx)&&Number.isFinite(v.vy))}const v=e.step(16,{...b,right:NaN});assert.equal(v.phase,'idle');assert.ok(Number.isFinite(v.point.x)&&Number.isFinite(v.point.y))}
{const e=p(), narrow={left:0,top:0,right:10,bottom:100};e.begin({x:-60,y:50},narrow,0);e.update({x:-60,y:50},narrow,1000);e.release(1000);let v=e.step(16,narrow);assert.ok(v.contacts.length>=2);assert.ok(v.bounces>=2);for(let i=0;i<v.contacts.length;i++){assert.equal(v.contacts[i]!.x,i%2===0?10:0);assert.ok(v.contacts[i]!.y>=0&&v.contacts[i]!.y<=100)}v.contacts[0]!.x=999;assert.notEqual(e.snapshot().contacts[0]!.x,999);assert.deepEqual(e.step(0,narrow).contacts,[]);assert.deepEqual(e.stop().contacts,[]);assert.equal(e.begin({x:5,y:50},narrow,1100).bounces,0)}
console.log('edge physics checks passed');
