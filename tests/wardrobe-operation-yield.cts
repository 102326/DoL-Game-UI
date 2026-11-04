// @ci-contract {"profiles":["standard"],"classification":"contract","granularity":"entry"}
import assert = require('node:assert/strict');
import receipt = require('../scripts/ci-process-receipt.cjs');
import playwright = require('playwright');
import browserOptions = require('./browser-options.cjs');

declare let fixture: {variables:{wardrobeOption:string;wardrobe:{upper:unknown[]}};calls:number;frames:FrameRequestCallback[];throwAction:boolean;api:{destroy():void;isBusy():boolean};state:{passage:string}};
const {chromium}=playwright;
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const server=await createServer({root:process.cwd(),configFile:false,plugins:[vue(),{name:'yield-fixture',configureServer(s){s.middlewares.use('/__yield__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch(browserOptions);
 try{
  await server.listen();const address=server.httpServer?.address();assert.ok(address&&typeof address!=='string');
  const page=await browser.newPage(),pageErrors:string[]=[];page.on('pageerror',e=>pageErrors.push(e.message));await page.goto(`http://127.0.0.1:${address.port}/__yield__`);
  async function setup(count:number){
   await page.evaluate(async count=>{
    if(typeof fixture!=='undefined')fixture.api.destroy();
    document.body.innerHTML='<div id="passages"><div class="passage" data-passage="Wardrobe"><div id="wardrobeList"></div></div></div>';
    const item=(index:number)=>({variable:'shirt'+index,name:'shirt'+index,name_cap:'Shirt '+index,accIcon:0,integrity:100,integrity_max:100,type:[],warmth:1});
    const variables={location:'home',lastWardrobeSlot:'upper',worn:{upper:item(0)},wardrobe:{space:20,upper:Array.from({length:count},(_,i)=>item(i+1))},wornStacking:{upper:[]},wardrobeDefaults:{},wardrobeOption:'wear'};
    const state={passage:'Wardrobe',variables};
    const f={variables,calls:0,frames:[] as FrameRequestCallback[],throwAction:false,api:null as unknown as typeof fixture.api,state};Object.assign(window,{fixture:f});
    const root={State:state,setup:{clothes:{upper:Array.from({length:count+1},(_,i)=>item(i))}},Wikifier:class{constructor(_output:Element,source:string){const match=source.match(/\$wardrobeOption="delete".*\$wear_upper=(\d+)/);if(!match)return;f.calls++;variables.wardrobeOption='delete';if(f.throwAction)throw Error('native failure');variables.wardrobe.upper.splice(Number(match[1]),1)}}};
    const modulePath='/src/wardrobe/main.ts';const module=await import(modulePath);f.api=module.startWardrobe(root);
   },count);
   await page.waitForSelector('.dgw-item');
   await page.getByRole('button',{name:'整理模式',exact:true}).click();
   for(let i=0;i<count;i++)await page.locator('.dgw-item').nth(i).click();
   await page.getByRole('button',{name:'审查丢弃',exact:true}).click();
   await page.waitForSelector('.dgw-confirm');
  }
  async function confirm(){return page.evaluate(()=>{
   window.requestAnimationFrame=(cb:FrameRequestCallback)=>{fixture.frames.push(cb);return fixture.frames.length};
   const button=[...document.querySelectorAll<HTMLButtonElement>('.dgw-confirm button')].find(x=>x.textContent?.trim()==='确认丢弃');if(!button)throw Error('missing confirmation');button.click();
   return {calls:fixture.calls,busy:fixture.api.isBusy(),mode:fixture.variables.wardrobeOption,remaining:fixture.variables.wardrobe.upper.length,frames:fixture.frames.length};
  })}
  await setup(1);const one=await confirm();
  assert.deepEqual(one,{calls:1,busy:false,mode:'wear',remaining:0,frames:0},'single completed action immediately restores native mode and unlocks');
  assert.equal(await page.locator('.dgw-preserved').evaluate(node=>(node as HTMLElement).inert),false,'native controls are unlocked');
  await page.reload();await setup(2);const first=await confirm();
  assert.deepEqual(first,{calls:1,busy:true,mode:'delete',remaining:1,frames:1},'batch yields between actions');
  await page.evaluate(()=>{const callback=fixture.frames.shift();if(!callback)throw Error('missing business yield');callback(performance.now())});
  await page.waitForFunction(()=>fixture.calls===2,undefined,{polling:10});
  assert.deepEqual(await page.evaluate(()=>({calls:fixture.calls,busy:fixture.api.isBusy(),mode:fixture.variables.wardrobeOption,remaining:fixture.variables.wardrobe.upper.length,frames:fixture.frames.length})),{calls:2,busy:false,mode:'wear',remaining:0,frames:0},'last action restores without another frame');
  await page.reload();await setup(2);await confirm();
  await page.evaluate(()=>{fixture.state.passage='Elsewhere';const callback=fixture.frames.shift();if(!callback)throw Error('missing business yield');callback(performance.now())});
  await page.waitForFunction(()=>!fixture.api.isBusy(),undefined,{polling:10});
  assert.deepEqual(await page.evaluate(()=>({calls:fixture.calls,remaining:fixture.variables.wardrobe.upper.length,mode:fixture.variables.wardrobeOption})),{calls:1,remaining:1,mode:'wear'},'passage change prevents remaining action and restores mode');
  await page.reload();await setup(2);await confirm();
  await page.evaluate(()=>{fixture.variables.wardrobe.upper.push({name:'external change'});const callback=fixture.frames.shift();if(!callback)throw Error('missing business yield');callback(performance.now())});
  await page.waitForFunction(()=>!fixture.api.isBusy(),undefined,{polling:10});
  assert.deepEqual(await page.evaluate(()=>({calls:fixture.calls,remaining:fixture.variables.wardrobe.upper.length,mode:fixture.variables.wardrobeOption})),{calls:1,remaining:2,mode:'wear'},'changed inventory prevents remaining action and restores mode');
  await page.reload();await setup(1);await page.evaluate(()=>{fixture.throwAction=true});await confirm();
  assert.deepEqual(await page.evaluate(()=>({calls:fixture.calls,busy:fixture.api.isBusy(),mode:fixture.variables.wardrobeOption,remaining:fixture.variables.wardrobe.upper.length})),{calls:1,busy:false,mode:'wear',remaining:1},'native exception restores state');
  assert.deepEqual(pageErrors,[],'no unhandled page errors');
  console.log('PASS wardrobe operation yield, final cleanup, passage change and native exception');
 }finally{await browser.close();await server.close()}
})().catch(error=>{receipt.terminalFailure(error);process.exitCode=1});
