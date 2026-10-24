import playwright = require('playwright');
import assert = require('node:assert/strict');
import path = require('node:path');
import url = require('node:url');
import type {GameUiControls} from '../src/runtime/game-controls';
const {chromium}=playwright,{pathToFileURL}=url;
declare const V:unknown;
declare const DoLStatusPreview:unknown;
declare const DoLGameUI:GameUiControls;
function installStatusProbe(){
 const foreignStatus={marker:true},originalGame=JSON.stringify(V);
 const probe={foreignStatus,originalGame,foreign(){
  const runtime:unknown=Reflect.get(window,'DoLRuntime');if(!runtime||typeof runtime!=='object'||!('status' in runtime))return undefined;
  const status=runtime.status;return status&&typeof status==='object'&&'v1' in status?status.v1:undefined;
 }};
 Object.assign(window,{DoLRuntime:{status:{v1:foreignStatus}},statusProbe:probe});
 localStorage.setItem('DoLMidnightTheme.preferences.v1',JSON.stringify({_scaleBaseline26:true,enabled:true,statusPreview:true,startupCacheLazy:true,fontScale:125,buttonScale:110,savesV2:true,visualGlass:false}));return probe;
}
declare const statusProbe:ReturnType<typeof installStatusProbe>;

(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.join(__dirname,'fixture.html')).href);await p.waitForSelector('#listContainer');
 await p.evaluate(installStatusProbe);
 await p.addStyleTag({path:path.join(__dirname,'../dist/game-ui.css')});await p.addScriptTag({path:path.join(__dirname,'../dist/game-ui.js')});await p.waitForFunction(()=>!!Reflect.get(window,'DoLGameUI'));
 const prefs=await p.evaluate(()=>DoLGameUI.getPreferences());assert.equal(prefs.statusPreview,false);assert.equal(prefs.startupCacheLazy,false);assert.equal(prefs.fontScale,125);assert.equal(prefs.buttonScale,110);assert.equal(prefs.savesV2,true);assert.equal(prefs.visualGlass,false);
 const stored=await p.evaluate(()=>{const text=localStorage.getItem('DoLMidnightTheme.preferences.v1');if(text===null)throw Error('Missing stored preferences');const data:unknown=JSON.parse(text);if(!data||typeof data!=='object'||!('statusPreview' in data)||!('startupCacheLazy' in data)||!('_scaleBaseline26' in data))throw Error('Missing stored preference fields');return data});assert.equal(stored.statusPreview,false);assert.equal(stored.startupCacheLazy,false);assert.equal(stored._scaleBaseline26,true);
 await p.evaluate(()=>{DoLGameUI.setPreference('statusPreview',true);DoLGameUI.setPreference('startupCacheLazy',true);DoLGameUI.openSettings()});assert.equal(await p.getByLabel('状态接口预览（实验）',{exact:true}).count(),0);assert.equal(await p.getByLabel('启动缓存按需重建（实验）',{exact:true}).count(),0);assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().statusPreview||DoLGameUI.getPreferences().startupCacheLazy),false);
 assert.equal(await p.evaluate(()=>statusProbe.foreign()===statusProbe.foreignStatus),true);assert.equal(await p.evaluate(()=>typeof DoLStatusPreview),'undefined');assert.equal(await p.evaluate(()=>JSON.stringify(V)===statusProbe.originalGame),true);
 await p.evaluate(()=>DoLGameUI.setPreference('wideReading',true));assert.equal(await p.evaluate(()=>DoLGameUI.getPreferences().wideReading),true);
 await p.evaluate(()=>DoLGameUI.destroy());assert.equal(await p.evaluate(()=>statusProbe.foreign()===statusProbe.foreignStatus),true);assert.deepEqual(errors,[]);
 console.log('PASS settings retirement: old true flags disabled, other preferences retained, no preview or game writes, foreign namespace preserved, normal settings work');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
