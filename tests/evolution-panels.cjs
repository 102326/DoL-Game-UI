// Shared coordinate contract on actual native panel consumers; not game acceptance.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const {createServer}=await import('vite'),vue=(await import('@vitejs/plugin-vue')).default;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'evo-panels',configureServer(s){s.middlewares.use('/__evo_panels__',(_q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><html><body></body></html>')})}}],server:{host:'127.0.0.1',port:0},logLevel:'error'});let browser;
 try{await server.listen();browser=await chromium.launch(require('./browser-options.cjs'));const results=[];
 for(const kind of ['journal','traits','statistics','feats','cheats','options']){
  const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__evo_panels__');await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
  const result=await page.evaluate(async kind=>{const {startPanels}=await import('/src/panels/main.ts');
   const attrs=kind==='journal'?'class="header"':kind==='traits'?'class="traitHeading"':kind==='statistics'?'class="foldoutHeader"':kind==='feats'?'':'class="settingsHeader"';
   const tag=kind==='journal'?'h1':kind==='traits'?'h4':'h2',wrap=kind==='traits'?'traitLists':kind==='cheats'?'cheatsShown':'fixture';
   const section=(id,label)=>kind==='feats'?`<div id="${id==='first'?'featTypes':'featsList'}" style="height:40px">${label}</div>`:`<${tag} id="${id}" ${attrs} style="margin:0;height:40px">${label}</${tag}>`;
   document.body.innerHTML=`<div id="customOverlay" data-overlay="${kind==='feats'?'gameFeats':kind}"><div id="customOverlayContent" style="height:240px;max-height:240px;overflow:auto"><div id="${wrap}" class="${kind==='statistics'?'foldout':''}">${section('first','First')}<div style="height:550px"></div>${section('target','Last')}<div style="height:550px"></div><button id="native">Native</button></div></div></div>`;
   let calls=0;const native=document.querySelector('#native');native.onclick=()=>calls++;native.click();const api=startPanels(window),content=document.querySelector('#customOverlayContent'),target=document.getElementById(kind==='feats'?'featsList':'target');const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await frame();const results=[];
   for(const zoom of [1,1.25,.85]){document.body.style.zoom=String(zoom);content.scrollTop=0;const select=document.querySelector('.dgp-navigation select');if(!select||select.options.length!==3)throw Error('Expected two actual groups '+kind);select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));await frame();results.push({zoom,gap:target.getBoundingClientRect().top-content.getBoundingClientRect().top,expected:12*zoom})}
   native.click();api.destroy();return{kind,results,nativePreserved:native.isConnected&&calls===2,remaining:document.querySelectorAll('.dgp-host').length};
  },kind);results.push(result);fs.mkdirSync('tests/artifacts/evolution',{recursive:true});fs.writeFileSync('tests/artifacts/evolution/panels.json',JSON.stringify(results,null,2));for(const g of result.results)assert.ok(Math.abs(g.gap-g.expected)<3,kind+' zoom '+JSON.stringify(g));assert.equal(result.nativePreserved,true);assert.equal(result.remaining,0);console.log('PASS EVO-A2 coordinates',kind);await page.close();
 }
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
