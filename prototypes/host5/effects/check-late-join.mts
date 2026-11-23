import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import type {createHost} from '../../../framework/host';
import type {createWeather,mountEffects} from './effects';
import type {createPanelBudget} from '../../../framework/motion/panel-budget';

const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0},plugins:[{
 name:'neutral-weather-receivers',configureServer(s){s.middlewares.use('/receivers',(_req,res)=>{
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>.receiver>div{position:relative;width:260px;height:180px}#signal{width:80px;height:3px;background:silver}</style><main class="receiver" id="a"></main><aside class="receiver" id="b"></aside><button id="signal">Panel</button>');
 })}}]});
await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const browser=await chromium.launch(process.env.HOST5_CHROME ? {channel:'chrome'} : {});
try{
 const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+address.port+'/receivers');
 const result=await page.evaluate(async()=>{
  const load=(path:string)=>import(/* @vite-ignore */path);
  const host=(await load('/framework/host.ts')).createHost(window) as ReturnType<typeof createHost>;
  const effects=await load('/prototypes/host5/effects/effects.ts') as {createWeather:typeof createWeather;mountEffects:typeof mountEffects};
  const budget=(await load('/framework/motion/panel-budget.ts')).createPanelBudget(window) as ReturnType<typeof createPanelBudget>;
  let time=0;
  const shared=effects.createWeather(host,()=>time), a=document.querySelector<HTMLElement>('#a')!,b=document.querySelector<HTMLElement>('#b')!;
  const reader=shared.reader;
  const readerBoundary=Object.isFrozen(reader)&&!('set' in reader)&&!('dispose' in reader)&&!Reflect.set(reader,'set',()=>{});
  const firstLease=reader.leaseField(),secondLease=reader.leaseField();
  firstLease.release();firstLease.release();const separateLease=reader.fieldUsers()===1;
  secondLease.release();
  let notices=0;const listener=()=>{notices++};
  const unsubscribeA=reader.subscribe(listener),unsubscribeB=reader.subscribe(listener);
  unsubscribeA();shared.set('sunny');const separateSubscriptions=notices===3&&reader.count()===1;
  unsubscribeB();let threw=false;try{reader.subscribe(()=>{throw Error('listener')})}catch{threw=true}
  const throwingListener=threw&&reader.count()===0;
  let notify=false,secondNotices=0,unsubscribeSecond=()=>{};
  const unsubscribeFirst=reader.subscribe(()=>{if(notify)unsubscribeSecond()});
  unsubscribeSecond=reader.subscribe(()=>{if(notify)secondNotices++});notify=true;shared.set('sunny');
  const unsubscribeDuringNotify=secondNotices===0;unsubscribeFirst();
  const mount=(id:string,parent:HTMLElement)=>effects.mountEffects(host,id,parent,shared.reader,'svg');
  const frame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  const observed=(parent:HTMLElement)=>{
   const svg=parent.querySelector('svg')!,groups=svg.querySelectorAll('g');
   const rain=groups[0]!,snow=groups[1]!,drop=rain.querySelector('rect')!,flake=snow.querySelector('circle')!;
   return {rain:Number(rain.getAttribute('fill-opacity'))/.75,snow:Number(snow.getAttribute('fill-opacity'))/.85,
    drop:[Number(drop.getAttribute('x')),Number(drop.getAttribute('y'))],flake:[Number(flake.getAttribute('cx')),Number(flake.getAttribute('cy'))],
    size:[svg.parentElement!.clientWidth,svg.parentElement!.clientHeight]};
  };
  const A=mount('PageWeather',a);shared.set('rain');time=450;await frame();shared.set('snow');
  time=675;await frame();
  const aNode=a.querySelector('svg'), initial=observed(a);
  // Negative control: same target and same deterministic seed, but a fresh local origin.
  const otherHost=(await load('/framework/host.ts')).createHost(window) as ReturnType<typeof createHost>;
  const privateWeather=effects.createWeather(otherHost,()=>time);
  privateWeather.set('snow');
  const wrong=effects.mountEffects(otherHost,'OnlyTarget',b,privateWeather.reader,'svg');const targetOnly=observed(b);
  wrong.dispose();privateWeather.dispose();otherHost.dispose();

  let B=mount('PanelWeather',b);
  const joined=observed(b), differentRenderers=aNode!==b.querySelector('svg');
  const signal=document.querySelector<HTMLElement>('#signal')!,track=budget.track([{transform:'scaleX(.15)'},{transform:'scaleX(1)'}],150,150);
  const opening=track.to(signal,true)!;opening.currentTime=75;const before=getComputedStyle(signal).transform;
  const closing=track.to(signal,false);
  const reversed=closing===opening&&opening.playbackRate<0&&before===getComputedStyle(signal).transform;
  time=765;await frame();const later=[observed(a),observed(b)];
  B.dispose();const usersAfterB=reader.fieldUsers();B=mount('PanelWeather',b);
  const remount=[observed(a),observed(b)],aSurvived=aNode===a.querySelector('svg');
  shared.set('rain');const redirected=[observed(a),observed(b)];
  time=990;await frame();const returning=[observed(a),observed(b)];
  // Probe a field identity, immediately returning the extra lease before changing ownership.
  const probe=reader.leaseField(),original=probe.field;probe.release();
  A.dispose();const survivor=reader.leaseField(),kept=survivor.field===original;survivor.release();
  const usersAfterA=reader.fieldUsers();B.dispose();const empty=reader.fieldUsers();
  const next=reader.leaseField(),recreated=next.field!==original;next.release();
  track.release();budget.dispose();shared.dispose();
  let leaseRejected=false,subscribeRejected=false;
  try{reader.leaseField()}catch{leaseRejected=true}
  try{reader.subscribe(()=>{})}catch{subscribeRejected=true}
  shared.set('sunny');const disposed=leaseRejected&&subscribeRejected&&reader.get()==='rain'&&reader.count()===0;
  const disposable=effects.createWeather(host,()=>time);disposable.reader.subscribe(()=>disposable.dispose());
  const immediateDispose=disposable.reader.count()===0;
  const notifying=effects.createWeather(host,()=>time);let disposeOnNotify=false,afterDispose=0;
  notifying.reader.subscribe(()=>{if(disposeOnNotify)notifying.dispose()});
  notifying.reader.subscribe(()=>{if(disposeOnNotify)afterDispose++});disposeOnNotify=true;notifying.set('rain');
  const disposeDuringNotify=afterDispose===0&&notifying.reader.count()===0;
  host.dispose();
  return {readerBoundary,separateLease,separateSubscriptions,throwingListener,immediateDispose,unsubscribeDuringNotify,disposeDuringNotify,disposed,initial,targetOnly,joined,differentRenderers,reversed,later,remount,aSurvived,redirected,returning,usersAfterB,usersAfterA,empty,kept,recreated,
   painters:document.querySelectorAll('svg').length,claims:host.getDiagnostics().claims.length};
 });
 assert.deepEqual(result.initial,result.joined);assert.notEqual(result.targetOnly.snow,result.joined.snow);
 assert.deepEqual(result.joined.drop,[40.5,128.25]);assert.deepEqual(result.joined.flake,[8.1,16.875]);
 assert.equal(result.joined.rain,.5);assert.equal(result.joined.snow,.5);assert.deepEqual(result.joined.size,[260,180]);
 for(const pair of [result.later,result.remount,result.redirected,result.returning])assert.deepEqual(pair[0],pair[1]);
 assert.deepEqual(result.later,result.remount);assert.deepEqual(result.redirected,result.later);
 assert.ok(Math.abs(result.later[0]!.snow-.7)<1e-8 && Math.abs(result.returning[0]!.snow-.35)<1e-8);
 assert.ok(result.readerBoundary&&result.separateLease&&result.separateSubscriptions&&result.throwingListener&&result.immediateDispose&&result.unsubscribeDuringNotify&&result.disposeDuringNotify&&result.disposed&&result.reversed&&result.aSurvived&&result.differentRenderers&&result.kept&&result.recreated);
 assert.deepEqual([result.usersAfterB,result.usersAfterA,result.empty,result.painters,result.claims],[1,1,0,0,0]);assert.deepEqual(errors,[]);
 const live=await page.evaluate(async()=>{
  const load=(p:string)=>import(/* @vite-ignore */p);
  const host=(await load('/framework/host.ts')).createHost(window) as ReturnType<typeof createHost>;
  const effects=await load('/prototypes/host5/effects/effects.ts') as {createWeather:typeof createWeather;mountEffects:typeof mountEffects};
  const shared=effects.createWeather(host);
  const a=document.querySelector<HTMLElement>('#a')!,b=document.querySelector<HTMLElement>('#b')!;
  const A=effects.mountEffects(host,'LiveA',a,shared.reader,'svg');
  const nextFrame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
  shared.set('rain');while(shared.reader.sample().progress<1)await nextFrame();
  shared.set('snow');while(shared.reader.sample().progress<.45)await nextFrame();
  const B=effects.mountEffects(host,'LiveB',b,shared.reader,'svg');
  const read=(n:HTMLElement)=>({snow:Number(n.querySelectorAll('g')[1]!.getAttribute('fill-opacity'))/.85,
   x:n.querySelector('circle')!.getAttribute('cx'),y:n.querySelector('circle')!.getAttribute('cy')});
  const pair=[read(a),read(b)];B.dispose();A.dispose();shared.dispose();host.dispose();return pair;
 });
 assert.deepEqual(live[0],live[1]);assert.ok(live[0]!.snow>=.45 && live[0]!.snow<1);
 console.log(JSON.stringify({browser:browser.version(),...result,live}));
}finally{await browser.close();await server.close()}
