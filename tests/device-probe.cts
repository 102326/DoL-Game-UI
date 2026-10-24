// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
// Controlled file-only smoke test; no physical-device acceptance claim.
import assert = require('node:assert/strict');
import fs = require('node:fs');
import path = require('node:path');
import url = require('node:url');
const {pathToFileURL}=url;
import playwright = require('playwright');
import type {DeviceProbeSample,DeviceProbePayload} from '../tools/device-probe';
const {chromium}=playwright;
declare let __probeForbiddenReads:number;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const number=(v:unknown)=>typeof v==='number'||v===null;
const numbers=(v:unknown,keys:readonly string[])=>object(v)&&keys.every(key=>number(v[key]));
function sample(v:unknown):v is DeviceProbeSample{if(!object(v))return false;const area=v.safeArea;return (
 ['type','observedAt','model','actualBrowser','gameHost','manualSystemDisplayScale','manualBrowserZoom','physicalConfirmationSource','viewportOrientation'].every(key=>typeof v[key]==='string')&&
 ['observed','physicalDeviceConfirmed','measuredOnPhysicalDevice','pointerCoarse','hoverNone'].every(key=>typeof v[key]==='boolean')&&
 ['innerWidth','innerHeight','devicePixelRatio','maxTouchPoints'].every(key=>number(v[key]))&&
 numbers(v.screenCSS,['width','height','availWidth','availHeight'])&&
 (v.screenOrientation===null||object(v.screenOrientation)&&typeof v.screenOrientation.type==='string'&&number(v.screenOrientation.angle))&&
 (v.visualViewport===null||numbers(v.visualViewport,['width','height','scale','offsetLeft','offsetTop']))&&
 object(area)&&['top','right','bottom','left'].every(key=>typeof area[key]==='number')&&
 object(v.browser)&&typeof v.browser.family==='string'&&typeof v.browser.version==='string');}
function payload(v:unknown):v is DeviceProbePayload{if(!object(v)||v.schemaVersion!==1||typeof v.scope!=='string'||!Array.isArray(v.samples))return false;const samples:unknown[]=v.samples;return samples.every(sample)}
(async()=>{
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,acceptDownloads:true});
  await context.addInitScript(()=>{
   Object.assign(window,{__probeForbiddenReads:0});
   const reject=()=>{__probeForbiddenReads++;throw Error('Probe must not read cookies or browser storage')};
   Object.defineProperty(Document.prototype,'cookie',{get:reject,set:reject});
   for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get:reject});
  });
  const page=await context.newPage(),requests:string[]=[],errors:string[]=[];
  page.on('request',request=>requests.push(request.url()));page.on('pageerror',error=>errors.push(error.message));
  const source=path.resolve(__dirname,'../tools/device-probe.html'),url=pathToFileURL(source).href;
  await page.goto(url);assert.equal(await page.locator('#physical').isChecked(),false);
  await page.locator('#model').fill('Redmi K90ProMax');await page.locator('#record').click();
  const read=async()=>{const value:unknown=JSON.parse(await page.locator('#output').inputValue());assert.ok(payload(value));return value};
  let report=await read(),first=report.samples[0];assert.ok(first);
  assert.equal(first.type,'browser-runtime-observation');assert.equal(first.observed,true);
  assert.equal(first.measuredOnPhysicalDevice,false);assert.equal(first.physicalDeviceConfirmed,false);
  assert.equal(first.physicalConfirmationSource,'user-assertion-only');
  assert.deepEqual([first.innerWidth,first.innerHeight,first.devicePixelRatio],[390,844,3]);
  assert.match(first.browser.version,/^(?:\d+(?:\.\d+)?|UNKNOWN)$/);
  assert.equal(first.viewportOrientation,'portrait');assert.ok(first.maxTouchPoints!==null&&first.maxTouchPoints>0);assert.equal(first.pointerCoarse,true);
  for(const key of ['actualBrowser','gameHost','manualSystemDisplayScale','manualBrowserZoom'] as const)assert.equal(first[key],'UNKNOWN');
  const expected=await page.evaluate(()=>{const vv=visualViewport;if(!vv)throw Error('Visual viewport absent');return {screenCSS:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},visualViewport:{width:vv.width,height:vv.height,scale:vv.scale,offsetLeft:vv.offsetLeft,offsetTop:vv.offsetTop}}});
  assert.deepEqual(first.screenCSS,expected.screenCSS);assert.deepEqual(first.visualViewport,expected.visualViewport);
  assert.ok(Object.values(first.safeArea).every(n=>Number.isFinite(n)&&n>=0));
  await page.setViewportSize({width:844,height:390});await page.locator('#model').fill('Xiaomi pad9 pro max');
  await page.locator('#browser').fill('Controlled Chromium fixture');await page.locator('#host').fill('Standalone controlled fixture');
  await page.locator('#displayScale').fill('UNKNOWN');await page.locator('#browserZoom').fill('125% (manual input)');await page.locator('#record').click();
  report=await read();assert.equal(report.samples.length,2);const second=report.samples[1];assert.ok(second);assert.ok(second.visualViewport);
  assert.deepEqual([second.innerWidth,second.innerHeight,second.devicePixelRatio],[844,390,3]);
  assert.equal(second.viewportOrientation,'landscape');assert.equal(second.model,'Xiaomi pad9 pro max');
  assert.equal(second.actualBrowser,'Controlled Chromium fixture');assert.equal(second.gameHost,'Standalone controlled fixture');
  assert.equal(second.manualSystemDisplayScale,'UNKNOWN');assert.equal(second.manualBrowserZoom,'125% (manual input)');
  assert.equal(second.visualViewport.scale,1,'manual zoom text must not alter observed scale');
  await page.locator('#physical').check();await page.locator('#record').click();
  report=await read();const third=report.samples[2];assert.ok(third);assert.equal(third.measuredOnPhysicalDevice,true);assert.equal(third.physicalDeviceConfirmed,true);
  assert.equal(third.physicalConfirmationSource,'user-assertion-only');
  const json=JSON.stringify(report);assert.doesNotMatch(json,/Mozilla\/|AppleWebKit\/|file:\/\/|https?:\/\//);
  const forbidden=/^(?:userAgent|platform|build|url|href|cookie|cookies|localStorage|sessionStorage|deviceId|serial|imei|physicalResolution)$/i;
  const inspect=(value:unknown):void=>{if(value&&typeof value==='object')for(const[key,child]of Object.entries(value)){assert.ok(!forbidden.test(key),`unexpected private or inferred field ${key}`);inspect(child)}};inspect(report);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  assert.equal(download.suggestedFilename(),'device-measurements.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(await download.path(),'utf8')),report);
  // Exercise file-context clipboard fallback without granting or invoking clipboard access.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true}));
  await page.locator('#copy').click();await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('手动复制'));
  await page.locator('#clear').click();assert.deepEqual((await read()).samples,[]);
  assert.ok(requests.includes(url));assert.ok(requests.every(value=>value===url||value.startsWith('blob:')),'self-contained probe must make no external requests');
  assert.equal(await page.evaluate(()=>__probeForbiddenReads),0);assert.deepEqual(errors,[]);
  console.log('PASS offline device probe: portrait/landscape observed metrics, UNKNOWN defaults, user-only physical confirmation, privacy, export/copy/clear; controlled Chromium fixture only');
 }finally{await browser.close()}
})().catch(error=>{require('../scripts/ci-process-receipt.cjs').terminalFailure(error);process.exitCode=1});
