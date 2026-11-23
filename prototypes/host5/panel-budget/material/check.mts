import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createLabServer} from '../server.mts';
import type {} from './lab.ts';
const server=await createLabServer();await server.listen();
const address=server.httpServer!.address();assert.ok(address&&typeof address==='object');
const channel=process.argv.find(arg=>arg.startsWith('--channel='))?.slice('--channel='.length);
const browser=await chromium.launch(channel?{channel}:{});
try{
 for(const width of [320,390]){
  const baseline=[];
  for(const mode of ['fallback','material','nohost','failed','static','unsupported']){
   const page=await browser.newPage({viewport:{width,height:820},reducedMotion:'reduce'});
   const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
   if(mode==='unsupported')await page.addInitScript(()=>{const supports=CSS.supports.bind(CSS);CSS.supports=((property:string,value?:string)=>property.includes('backdrop-filter')?false:value===undefined?supports(property):supports(property,value)) as typeof CSS.supports});
   await page.goto(`http://127.0.0.1:${address.port}/prototypes/host5/panel-budget/material/?${mode}`);
   await page.waitForFunction(()=>!!window.materialLab);
   if(mode==='static')await page.evaluate(()=>{const theme=Reflect.get(window,'DoLMidnightTheme') as {setPreference(key:'visualGlass',value:boolean):void};theme.setPreference('visualGlass',false)});
   const start=page.locator('#start'),close=page.getByRole('button',{name:'Close',exact:true}),dialog=page.locator('dialog');
   const layer=page.locator('#independent [data-sf-mount="scrim"]');
   assert.equal(await layer.count(),['material','static','unsupported'].includes(mode)?1:0);
   assert.equal(await dialog.locator('[data-sf-mount="scrim"]').count(),0);
   if(await layer.count()){
    const props=await layer.evaluate(n=>({aria:n.getAttribute('aria-hidden'),inert:(n as HTMLElement).inert,pointer:getComputedStyle(n).pointerEvents,filter:getComputedStyle(n).backdropFilter,color:getComputedStyle(n).backgroundColor}));
    assert.equal(props.aria,'true');assert.equal(props.inert,true);assert.equal(props.pointer,'none');
    if(mode==='material')assert.equal(props.filter,'blur(4px)');
    else {assert.equal(props.filter,'none');assert.equal(props.color,'rgb(30, 34, 40)')}
   }
   if(mode!=='nohost')await page.getByRole('button',{name:'Inspector',exact:true}).click();
   if(mode!=='nohost'){
    const background=await page.locator('#independent article').evaluate(n=>getComputedStyle(n).backgroundColor);
    assert.equal(background,await layer.count()?'rgba(0, 0, 0, 0)':'rgb(65, 69, 74)');
    assert.notEqual(await page.locator('#independent').evaluate(n=>getComputedStyle(n).backgroundImage),'none');
   }
   await start.focus();await page.keyboard.press('Enter');assert.ok(await close.evaluate(n=>document.activeElement===n));
   const settings=await dialog.locator('.dmt-settings-shell').evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {rect:[r.x,r.y,r.width,r.height],background:s.backgroundColor,filter:s.backdropFilter}});
   assert.ok(settings.rect[0]!>=0&&settings.rect[0]!+settings.rect[2]!<=width);
   if(['fallback','material','nohost','failed'].includes(mode))baseline.push(settings);
   if(mode==='static'||mode==='unsupported'){assert.equal(settings.filter,'none');assert.equal(settings.background,'rgb(29, 38, 43)')}
   await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});assert.ok(await start.evaluate(n=>n===document.activeElement));
   if(mode==='material'){
    const peer=await layer.elementHandle();await page.evaluate(()=>window.materialLab.removeSettings());assert.ok(await peer!.evaluate(n=>n.isConnected));
    for(let i=0;i<24;i++){
     const counts=await page.evaluate(()=>{const l=window.materialLab;l.removePeer();l.removeSettings();const d=l.diagnostics();l.mountSettings();l.mountPeer();return [d.mounts.length,d.participants.length,l.diagnostics().mounts.length]});
     assert.deepEqual(counts,[0,0,2]);
    }
    await layer.evaluate(n=>n.remove());
    assert.equal(await page.locator('#independent article').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(65, 69, 74)');
    await page.evaluate(()=>window.DoLUiHost!.dispose());assert.equal(await layer.count(),0);
    await start.click();await close.click();
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.evaluate(()=>window.materialLab.dispose());assert.equal(await layer.count(),0);assert.deepEqual(errors,[]);
   await page.close();
  }
  for(const result of baseline.slice(1))assert.deepEqual(result,baseline[0]);
  console.log(JSON.stringify({browser:browser.version(),width,settingsBaseline:baseline[0]}));
 }
}finally{await browser.close();await server.close()}
