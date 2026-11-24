import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';

const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:0}});
await server.listen();
const address=server.httpServer!.address();
assert.ok(address&&typeof address==='object');
const browser=await chromium.launch({channel:process.env.HOST5_BROWSER||'chrome'});
try{
 for(const solo of [false,true]){
  const page=await browser.newPage();
  const scripts:string[]=[],errors:string[]=[];
  page.on('request',r=>scripts.push(new URL(r.url()).pathname));
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+address.port+'/prototypes/host5/theme/'+(solo?'?solo':''));
  const sample=(id:string)=>page.locator(id).evaluate(n=>{
   const style=getComputedStyle(n),chip=getComputedStyle(n.querySelector('span')!);
   return [style.backgroundColor,style.color,style.borderTopColor,chip.backgroundColor,chip.color,getComputedStyle(n.querySelector('small')!).color];
  });
  const peer='#b .sample';
  await page.waitForFunction(()=>document.querySelector<HTMLElement>('#b .sample')?.style.getPropertyValue('--theme-accent'));
  const initial=await sample(peer);
  assert.equal(await page.locator('#a .sample').count(),solo?0:1);
  await page.locator('select').selectOption('slate');
  const draft=await sample('#preview');
  assert.notDeepEqual(draft,initial);
  assert.deepEqual(await sample(peer),initial);
  if(!solo)assert.deepEqual(await sample('#a .sample'),initial);
  await page.locator('#apply').click();
  assert.deepEqual(await sample(peer),draft);
  assert.equal(draft[3],'rgb(146, 186, 213)');
  const node=await page.locator(peer).elementHandle();assert.ok(node);
  if(!solo){
   assert.deepEqual(await sample('#a .sample'),draft);
   await page.locator('#remove').click();
   assert.equal(await page.locator('#a .sample').count(),0);
   assert.deepEqual(await sample(peer),draft);
   await page.locator('select').selectOption('graphite');await page.locator('#apply').click();
   assert.deepEqual(await sample(peer),initial);
   assert.ok(await node.evaluate(n=>n.isConnected));
  }
  const state=await page.evaluate(async()=>{
   const host=window.DoLUiHost!;
   return {official:'DoLGameUI' in window,owners:host.getDiagnostics().participants,
    palette:await host.sources('host5.theme')[0]!.read(host.binding())};
  });
  assert.equal(state.official,false);assert.equal(state.palette.ok,true);
  assert.deepEqual([...state.owners].sort(),['HostThemeLab','ThemeInspector']);
  assert.deepEqual(scripts.filter(s=>s.includes('/official-ui/')||(s.includes('/src/')&&!s.endsWith('/src/theme/appearance.ts'))),[]);
  assert.deepEqual(errors,[]);
  console.log(browser.version(),solo?'solo':'paired',draft,'peer retained');
  await page.close();
 }
}finally{await browser.close();await server.close()}
