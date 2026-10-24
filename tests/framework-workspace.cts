import fs = require('node:fs');
import path = require('node:path');
import assert = require('node:assert/strict');
import playwright = require('playwright');
import esbuild = require('esbuild');
import type {Host,Participant,Binding} from '../framework/contracts';
declare const DoLUiHost:Readonly<Host>;
declare const StoneFree_alternate_workspace:Pick<typeof import('../framework/examples/alternate-workspace-mod'),'dispose'>;
declare const StoneFree_workspace:Pick<typeof import('../framework/examples/workspace-mod'),'dispose'>;
declare const StoneFree_comparison:Pick<typeof import('../framework/examples/comparison-mod'),'dispose'>;
declare const StoneFree_native_status:Pick<typeof import('../framework/examples/status-mod'),'dispose'>;
declare const StoneFree_host:typeof import('../framework/boot');
declare let keys:number,clicks:number,foreignKey:string,cleaned:number;
declare let native:HTMLInputElement,nativeParent:Node|null,nativeNext:ChildNode|null,originalView:Element|null;
declare let extra:Readonly<Participant>,pendingOwner:Readonly<Participant>,old:Binding;
declare let removeExtra:()=>void,removeLong:()=>void,withdraw:()=>void,returnCleanup:(()=>void)|null,originalSetItem:Storage['setItem'];
declare const State:{variables:{pain:number;stress:number;tiredness:number}};
const {chromium}=playwright,{buildSync}=esbuild;
function must<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing workspace fixture value');return value}
function layoutOf(value:unknown):{order:string[];hidden:string[];density:string}{
 if(value===null||typeof value!=='object'||!('order' in value)||!Array.isArray(value.order)||!value.order.every(x=>typeof x==='string')||!('hidden' in value)||!Array.isArray(value.hidden)||!value.hidden.every(x=>typeof x==='string')||!('density' in value)||typeof value.density!=='string')throw Error('Invalid workspace layout JSON');
 return {order:value.order,hidden:value.hidden,density:value.density};
}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'tests/artifacts/stone-free-workspace','browser-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const tests:string[]=[];const read=(p:string)=>fs.readFileSync(path.join(root,p),'utf8');
const check=async(name:string,fn:()=>Promise<void>)=>{await fn();tests.push(name);console.log('PASS',name)};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1280,height:900}}),errors:string[]=[];p.setDefaultTimeout(5000);p.on('pageerror',e=>errors.push(e.message));
  await p.route('http://workspace.test/',r=>r.fulfill({contentType:'text/html',body:'<style>body{height:2200px;background:#172330;color:white}#native-region{margin-top:750px}</style><div id="native-region"><input id="native"><button id="foreign">Other Mod</button></div><main id="passages"></main>'}));await p.goto('http://workspace.test/');
  await p.evaluate(()=>{const native=document.querySelector<HTMLInputElement>('#native'),foreign=document.querySelector<HTMLButtonElement>('#foreign');if(!native||!foreign)throw Error('Missing native fixture controls');Object.assign(window,{State:{variables:{pain:4,stress:12,tiredness:8}},keys:0,clicks:0,native,nativeParent:native.parentNode,nativeNext:native.nextSibling});document.addEventListener('keydown',()=>keys++);foreign.onclick=()=>{clicks++};window.scrollTo(0,650)});
  for(const name of ['host','native-status','comparison','workspace','alternate-workspace']){
   if(name!=='host')await p.addStyleTag({content:read(`dist/framework/${name}/style.css`)});
   await p.addScriptTag({content:read(`dist/framework/${name}/index.js`)});
   if(name==='host')await p.evaluate(()=>DoLUiHost.sceneReady());
  }
  const alpha=p.locator('[data-sf-owner="StoneFreeWorkspace"]'),beta=p.locator('[data-sf-owner="AlternateWorkspace"]');
  const dialog=alpha.locator('dialog');
  await check('two packaged layouts negotiate the same explicit region and shortcut',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).waitFor();
   assert.equal(await alpha.locator('section').first().getAttribute('data-region-state'),'active');
   assert.equal(await beta.locator('section').first().getAttribute('data-region-state'),'busy');
   const claims=await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.filter(c=>c.key==='information-workspace'||c.key==='workspace-k'));
   assert.equal(claims.length,2);assert.ok(claims.every(c=>c.owner==='StoneFreeWorkspace'));
   await beta.getByRole('button',{name:'侧边工作台',exact:true}).click();assert.equal(await beta.locator('dialog').getAttribute('open'),null);
  });
  await check('public views from two independent providers render without official UI',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
   await dialog.locator('article').nth(1).waitFor();assert.equal(await p.evaluate(()=>!!Reflect.get(window,'DoLGameUI')),false);
   assert.deepEqual(await dialog.locator('article').evaluateAll(nodes=>nodes.map(n=>n.dataset.view)),['NativeStatus:status','StatusComparison:comparison']);
   await p.waitForFunction(()=>document.querySelector('[data-view="NativeStatus:status"] dd')?.textContent==='4');
   await dialog.getByRole('button',{name:'设为对照',exact:true}).click();await p.evaluate(()=>State.variables.pain=7);
   await dialog.getByRole('button',{name:'刷新对照',exact:true}).click();await p.waitForFunction(()=>document.querySelector('[data-view="StatusComparison:comparison"] tbody tr td:last-child')?.textContent==='3');
  });
  await check('layout editing preserves instances while moving; hide/show preserves source and only writes own preferences',async()=>{
   await p.evaluate(()=>{Object.assign(window,{originalView:document.querySelector('[data-view="NativeStatus:status"] [data-sf-mount]'),foreignKey:'ForeignMod.settings'});localStorage.setItem(foreignKey,'untouched')});
   await dialog.getByRole('button',{name:'编辑布局',exact:true}).click();await dialog.getByRole('button',{name:'状态对照向上',exact:true}).click();
   assert.equal(await dialog.locator('article').first().getAttribute('data-view'),'StatusComparison:comparison');
   assert.equal(await p.evaluate(()=>originalView===document.querySelector('[data-view="NativeStatus:status"] [data-sf-mount]')),true);
   await dialog.getByRole('checkbox',{name:'状态速览',exact:true}).uncheck();assert.equal(await dialog.locator('[data-view="NativeStatus:status"]').count(),0);
   await dialog.getByRole('checkbox',{name:'状态速览',exact:true}).check();await dialog.locator('[data-view="NativeStatus:status"] dd').first().waitFor();
   await dialog.getByRole('combobox',{name:'密度',exact:true}).selectOption('compact');
   const data=await p.evaluate(()=>{const raw=localStorage.getItem('StoneFreeWorkspace.StoneFreeWorkspace.v1');if(raw===null)throw Error('Missing own layout');const own:unknown=JSON.parse(raw);return {own,foreign:localStorage.getItem(foreignKey),source:DoLUiHost.sources('dol.status.experimental').length}});
   const own=layoutOf(data.own);assert.equal(own.density,'compact');assert.equal(own.order[0],'StatusComparison:comparison');assert.equal(data.foreign,'untouched');assert.equal(data.source,1);
   await dialog.getByRole('button',{name:'完成编辑',exact:true}).click();await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  });
  await check('read/open/compare/close returns original focus and scroll without moving native controls',async()=>{
   const before=await p.evaluate(()=>({scroll:scrollY,parent:native.parentNode===nativeParent,next:native.nextSibling===nativeNext}));
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await p.keyboard.press('Escape');
   assert.equal(await alpha.getByRole('button',{name:'信息工作台',exact:true}).evaluate(n=>n===document.activeElement),true);
   assert.deepEqual(await p.evaluate(()=>({scroll:scrollY,parent:native.parentNode===nativeParent,next:native.nextSibling===nativeNext})),before);
  });
  await check('provider release removes its instances without affecting peers or the original scene',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
   await p.evaluate(()=>{Object.assign(window,{extra:DoLUiHost.register('AuthorC')});Object.assign(window,{removeExtra:extra.provideView({id:'extra',title:'晚到内容',setup(c){c.element.textContent='public new view'}})} )});
   await dialog.getByRole('heading',{name:'晚到内容',exact:true}).waitFor();
   await p.evaluate(()=>removeExtra());assert.equal(await dialog.locator('[data-view="AuthorC:extra"]').count(),0);assert.equal(await dialog.locator('article').count(),2);
   await p.evaluate(()=>{Object.assign(window,{removeLong:extra.provideView({id:'X'.repeat(80),title:'长标识视图',setup(c){c.element.textContent='long view is supported'}})} )});
   await dialog.getByText('long view is supported',{exact:true}).waitFor();await p.evaluate(()=>removeLong());
   await p.evaluate(()=>extra.provideView({id:'broken',title:'故障视图',setup(){throw Error('private failure')}}));
   await dialog.getByText('该视图暂不可用。',{exact:false}).waitFor();assert.equal(await dialog.locator('[data-view="NativeStatus:status"] dd').count(),3);
   await p.evaluate(()=>extra.dispose());await p.keyboard.press('Escape');
  });
  await check('native input and nonparticipant events are not intercepted; composing and child-view keys are excluded',async()=>{
   await p.locator('#native').fill('normal');await p.keyboard.press('k');assert.equal(await p.locator('.sf-workspace[open]').count(),0);assert.equal(await p.locator('#native').inputValue(),'normalk');
   await p.locator('#foreign').click();assert.equal(await p.evaluate(()=>clicks),1);
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).focus();
   const composing=await p.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'k',isComposing:true,bubbles:true,cancelable:true});if(!document.activeElement)throw Error('Missing focused fixture control');document.activeElement.dispatchEvent(e);return e.defaultPrevented});assert.equal(composing,false);
   await p.keyboard.press('k');assert.equal(await dialog.getAttribute('open'),'');
   await dialog.getByRole('button',{name:'刷新状态',exact:true}).focus();await p.keyboard.press('k');assert.equal(await dialog.getAttribute('open'),'','provider-owned input is not owned by the layout');await p.keyboard.press('Escape');
  });
  await check('region/shortcut handoff never leaves two active layouts or duplicate modal ownership',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.getByText('布局提供者',{exact:true}).click();await dialog.getByRole('button',{name:'释放工作区',exact:true}).click();
   await p.waitForFunction(()=>!DoLUiHost.getDiagnostics().claims.some(c=>c.owner==='StoneFreeWorkspace'));
   await beta.getByRole('button',{name:'侧边工作台',exact:true}).click();await beta.locator('dialog article').first().waitFor();
   assert.equal(await p.locator('.sf-workspace[open]').count(),1);assert.equal(await p.evaluate(()=>DoLUiHost.getDiagnostics().claims.filter(c=>c.kind==='modal').length),0);assert.equal(await beta.locator('dialog').evaluate(n=>n.matches(':modal')),false);
   const blocked=await p.evaluate(()=>{const button=document.querySelector<HTMLButtonElement>('[data-sf-owner="StoneFreeWorkspace"] button');if(!button)throw Error('Missing workspace launch button');button.click();return document.querySelectorAll('.sf-workspace[open]').length});assert.equal(blocked,1);
   await beta.getByText('布局提供者',{exact:true}).click();await beta.getByRole('button',{name:'释放工作区',exact:true}).click();
   await p.waitForFunction(()=>!DoLUiHost.getDiagnostics().claims.some(c=>c.key==='information-workspace'));
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();assert.equal(await dialog.getAttribute('open'),'');await p.keyboard.press('Escape');
  });
  await check('layout survives a new Host generation; async view withdrawal cannot resurrect content',async()=>{
   await p.evaluate(()=>{DoLUiHost.dispose()});
   await p.addScriptTag({content:read('dist/framework/host/index.js')});await p.evaluate(()=>DoLUiHost.sceneReady());await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
   assert.equal(await dialog.locator('article').first().getAttribute('data-view'),'StatusComparison:comparison');assert.equal(await dialog.getByRole('combobox',{name:'密度',exact:true}).inputValue(),'compact');
   await p.evaluate(()=>{
    Object.assign(window,{pendingOwner:DoLUiHost.register('AsyncAuthor'),returnCleanup:null,cleaned:0});
    Object.assign(window,{withdraw:pendingOwner.provideView({id:'late',title:'异步视图',setup:()=>new Promise(resolve=>returnCleanup=()=>resolve(()=>cleaned++))})});
   });
   await dialog.locator('[data-view="AsyncAuthor:late"]').waitFor();await p.evaluate(()=>{withdraw();if(!returnCleanup)throw Error('Missing async view cleanup');returnCleanup()});
   await p.waitForFunction(()=>cleaned===1);assert.equal(await dialog.locator('[data-view="AsyncAuthor:late"]').count(),0);await p.keyboard.press('Escape');
  });
  await check('local layout reset restores defaults without clearing peer preferences, provider state or game values',async()=>{
   await p.evaluate(()=>{localStorage.setItem('StoneFreeWorkspace.AlternateWorkspace.v1','{"order":[],"hidden":["FutureMod:future"],"density":"compact"}')});
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.getByRole('button',{name:'设为对照',exact:true}).click();
   await dialog.getByRole('button',{name:'编辑布局',exact:true}).click();await dialog.getByRole('checkbox',{name:'状态速览',exact:true}).uncheck();
   await dialog.getByRole('button',{name:'恢复本布局',exact:true}).click();await dialog.locator('[data-view="NativeStatus:status"] dd').first().waitFor();
   assert.deepEqual(await dialog.locator('article').evaluateAll(nodes=>nodes.map(n=>n.dataset.view)),['NativeStatus:status','StatusComparison:comparison']);
   assert.equal(await dialog.getByRole('combobox',{name:'密度',exact:true}).inputValue(),'comfortable');
   assert.equal(await dialog.locator('[data-view="StatusComparison:comparison"] tbody tr td').nth(1).textContent(),'7');
   const r=await p.evaluate(()=>{const ownRaw=localStorage.getItem('StoneFreeWorkspace.StoneFreeWorkspace.v1'),peerRaw=localStorage.getItem('StoneFreeWorkspace.AlternateWorkspace.v1');if(ownRaw===null||peerRaw===null)throw Error('Missing workspace layout');const own:unknown=JSON.parse(ownRaw),peer:unknown=JSON.parse(peerRaw);return {own,peer,foreign:localStorage.getItem(foreignKey),pain:State.variables.pain}});
   assert.deepEqual({...r,own:layoutOf(r.own),peer:layoutOf(r.peer)},{own:{order:[],hidden:[],density:'comfortable'},peer:{order:[],hidden:['FutureMod:future'],density:'compact'},foreign:'untouched',pain:7});
   await dialog.getByRole('button',{name:'完成编辑',exact:true}).click();await p.keyboard.press('Escape');
   await p.evaluate(()=>DoLUiHost.dispose());await p.addScriptTag({content:read('dist/framework/host/index.js')});await p.evaluate(()=>DoLUiHost.sceneReady());await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
   assert.equal(await dialog.getByRole('combobox',{name:'密度',exact:true}).inputValue(),'comfortable');assert.equal(await dialog.locator('article').count(),2);await p.keyboard.press('Escape');
  });
  await check('reset remains usable with denied storage and reports its persistence limit',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.getByRole('button',{name:'编辑布局',exact:true}).click();
   await dialog.getByRole('combobox',{name:'密度',exact:true}).selectOption('compact');
   await p.evaluate(()=>{Object.assign(window,{originalSetItem:Storage.prototype.setItem});Storage.prototype.setItem=function(key,value){if(key==='StoneFreeWorkspace.StoneFreeWorkspace.v1')throw Error('storage denied');return originalSetItem.call(this,key,value)}});
   try {await dialog.getByRole('button',{name:'恢复本布局',exact:true}).click();assert.equal(await dialog.getByRole('combobox',{name:'密度',exact:true}).inputValue(),'comfortable');await dialog.getByText('本次布局无法保存；当前显示仍已调整。',{exact:true}).waitFor()}
   finally {await p.evaluate(()=>Storage.prototype.setItem=originalSetItem)}
   await dialog.getByRole('button',{name:'恢复本布局',exact:true}).click();await dialog.getByRole('button',{name:'完成编辑',exact:true}).click();await p.keyboard.press('Escape');
  });
  await check('scene invalidation closes the workspace immediately and old view bindings stay dead',async()=>{
   await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
   await p.evaluate(()=>{Object.assign(window,{old:DoLUiHost.binding()});DoLUiHost.invalidateScene()});assert.equal(await p.locator('.sf-workspace[open]').count(),0);assert.equal(await p.evaluate(()=>old.isCurrent()),false);
   await p.evaluate(()=>DoLUiHost.sceneReady());await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.locator('article').first().waitFor();await p.keyboard.press('Escape');
  });
  await check('representative narrow and wide windows fit and retain usable closing controls',async()=>{
   for(const size of [{width:390,height:844},{width:844,height:390},{width:760,height:800},{width:1280,height:900}]){
    await p.setViewportSize(size);await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();
    assert.equal(await dialog.evaluate(n=>n.scrollWidth<=n.clientWidth),true);const box=must(await dialog.boundingBox());assert.ok(box.x>=0&&box.x+box.width<=size.width);
    await dialog.getByRole('button',{name:'关闭',exact:true}).click();
   }
   await p.setViewportSize({width:1280,height:900});await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.screenshot({path:path.join(dir,'workspace-wide.png')});await p.keyboard.press('Escape');
   await p.setViewportSize({width:390,height:844});await alpha.getByRole('button',{name:'信息工作台',exact:true}).click();await dialog.screenshot({path:path.join(dir,'workspace-narrow.png')});await p.keyboard.press('Escape');
  });
  await check('explicit package uninstall removes waiting subscriptions, not just current panels',async()=>{
   await p.evaluate(()=>{StoneFree_alternate_workspace.dispose();StoneFree_workspace.dispose();StoneFree_comparison.dispose();StoneFree_native_status.dispose();StoneFree_host.dispose()});
   assert.equal(await p.locator('[data-sf-owner]').count(),0);
   const remaining=await p.evaluate(()=>{const probe=StoneFree_host.installHost();if(!probe)throw Error('Missing Host probe');const count=probe.host.getDiagnostics().participants.length;probe.dispose();return count});
   assert.equal(remaining,0,'uninstalled packages must not rejoin a new Host');
  });
  assert.deepEqual(errors,[]);
  // Pure preferences boundary: malformed/foreign data and unavailable storage.
  const module=must(buildSync({entryPoints:[path.join(root,'framework/workspace/preferences.ts')],bundle:true,write:false,format:'cjs'}).outputFiles[0]).text;
  const holder:{exports:Partial<typeof import('../framework/workspace/preferences')>}={exports:{}};new Function('module','exports',module)(holder,holder.exports);
  assert.deepEqual(must(holder.exports.readLayout)({getItem:()=>'{bad'},'own'),{order:[],hidden:[],density:'comfortable'});
  assert.deepEqual(must(holder.exports.readLayout)({getItem:()=>JSON.stringify({order:['NativeStatus:status','bad','NativeStatus:status'],hidden:[1,'StatusComparison:comparison'],density:'other'})},'own'),{order:['NativeStatus:status'],hidden:['StatusComparison:comparison'],density:'comfortable'});
  assert.equal(must(holder.exports.saveLayout)({setItem(){throw Error('denied')}},'own',{order:[],hidden:[],density:'compact'}),false);
  tests.push('bounded preferences ignore unknown/malformed fields and survive storage denial');
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({status:'passed',scope:'Browser fixtures; no physical phone or real Gameplay claim',tests},null,2));console.log('OUTPUT',dir);
 }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({status:'failed',tests,error:e.message},null,2));console.error(e);process.exitCode=1});
