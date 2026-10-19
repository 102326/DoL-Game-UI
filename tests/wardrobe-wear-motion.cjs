const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const [{createServer},{default:vue}]=await Promise.all([import('vite'),import('@vitejs/plugin-vue')]);
 const server=await createServer({root:process.cwd(),configFile:false,plugins:[vue(),{name:'wardrobe-wear-fixture',configureServer(s){s.middlewares.use('/__wardrobe_wear__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<html><body></body></html>')})}}],optimizeDeps:{noDiscovery:true,include:['vue']},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 const browser=await chromium.launch(require('./browser-options.cjs'));
 try{
  await server.listen();const page=await browser.newPage({viewport:{width:1000,height:800}});
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__wardrobe_wear__');
  await page.addStyleTag({path:'src/theme/kraft-work-pages.css'});
  for(const zoom of [.8,1,1.25]){
   await page.evaluate(async zoom=>{
    window.testWardrobe?.destroy();document.body.innerHTML='<div style="height:150px"></div><div id="passages"><div class="passage" data-passage="Wardrobe"><div id="wardrobeList"></div></div></div><div style="height:1000px"></div>';
    document.body.style.zoom=zoom;document.documentElement.setAttribute('data-stone-free','');document.documentElement.setAttribute('data-dgu-visualMotion','');
    const item=index=>({index,variable:'shirt'+index,name:'shirt'+index,name_cap:'Shirt '+index,accIcon:0,integrity:100,integrity_max:100,type:[],warmth:1});
    const variables={location:'home',lastWardrobeSlot:'upper',worn:{upper:item(0)},wardrobe:{space:20,upper:[item(1),item(2)]},wornStacking:{upper:[]},wardrobeDefaults:{}};
    window.nativeCalls=0;
    const root={State:{passage:'Wardrobe',variables},setup:{clothes:{upper:[item(0),item(1),item(2)]}},Wikifier:class{constructor(output,source){const match=source.match(/wearlink_norefresh "Soft & Wet" (\d+)/);if(!match)return;const a=document.createElement('a');a.className='link-internal';a.onclick=()=>{nativeCalls++;variables.wornStacking.upper.push(variables.wardrobe.upper.splice(Number(match[1]),1)[0]);document.querySelector('#growth').style.height=(nativeCalls*140)+'px'};output.append(a)}}};
    window.testWardrobe=(await import('/src/wardrobe/main.ts')).startWardrobe(root);
   },zoom);
   await page.waitForSelector('.dgw-item');
   await page.evaluate(()=>{const list=document.querySelector('.dgw-items'),growth=document.createElement('div'),filler=document.createElement('div');growth.id='growth';list.before(growth);filler.style.height='500px';list.append(filler);list.style.height='180px';list.style.overflow='auto';window.scrollTo(0,100)});
   const before=await page.evaluate(()=>{const item=document.querySelector('.dgw-item'),list=item.closest('.dgw-items');const box=item.getBoundingClientRect(),parent=list.getBoundingClientRect();item.click();return {box:box.toJSON(),parent:parent.toJSON()}});
   await page.waitForTimeout(90);
   const after=await page.evaluate(()=>{const n=document.querySelector('.kw-wardrobe-press'),p=document.querySelector('.dgw-items');return {parent:n?.parentElement===p,box:n?.getBoundingClientRect().toJSON(),list:p.getBoundingClientRect().toJSON(),pointer:n&&getComputedStyle(n).pointerEvents,calls:nativeCalls}});
   assert.equal(after.parent,true);assert.equal(after.pointer,'none');assert.equal(after.calls,1);
   for(const axis of ['x','y'])assert.ok(Math.abs((after.box[axis]-after.list[axis])-(before.box[axis]-before.parent[axis]))<1.5,`Ripple follows inventory at zoom ${zoom}: ${axis}`);
   for(const size of ['width','height'])assert.ok(Math.abs(after.box[size]-before.box[size])<1.5,`Ripple size at zoom ${zoom}`);
   const scrolled=await page.evaluate(()=>{const list=document.querySelector('.dgw-items');const before=list.scrollTop;list.scrollTop+=32;return {delta:list.scrollTop-before,box:document.querySelector('.kw-wardrobe-press').getBoundingClientRect().toJSON()}});
   assert.ok(scrolled.delta>30&&scrolled.delta<34);assert.ok(Math.abs(after.box.y-scrolled.box.y-scrolled.delta*zoom)<1.5,'Inner scrolling carries the material with the list');
   await page.evaluate(()=>{window.scrollBy(0,60);document.querySelector('.dgw-item').click()});await page.waitForTimeout(80);
   assert.equal(await page.locator('.kw-wardrobe-press').count(),1,'Repeated wear replaces only its own material');
   await page.evaluate(()=>testWardrobe.destroy());await page.waitForTimeout(30);assert.equal(await page.locator('.kw-wardrobe-press').count(),0);
  }
  console.log('PASS actual wardrobe wear material follows inventory growth at 80/100/125% zoom; single native callback, repeated wear and teardown');
 }finally{await browser.close();await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
