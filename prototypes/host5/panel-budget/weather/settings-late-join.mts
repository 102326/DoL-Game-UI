import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import vue from '@vitejs/plugin-vue';

const server = await createServer({configFile:false, plugins:[vue()], server:{host:'127.0.0.1',port:0}});
await server.listen();
const address = server.httpServer!.address(); assert.ok(address && typeof address === 'object');
const browser = await chromium.launch({channel:'chrome'});
try {
 const page = await browser.newPage({viewport:{width:1000,height:800}, reducedMotion:'no-preference'});
 const errors:string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.route('**/settings-weather-test', route => route.fulfill({contentType:'text/html',
  body:'<!doctype html><html data-stone-free><body><div id="menu"></div><main id="passages"><section class="passage dgp-overlay" style="position:relative;width:400px;height:240px"><header class="dgp-host">Reference</header></section></main></body></html>'}));
 await page.goto(`http://127.0.0.1:${address.port}/settings-weather-test`);
 await page.addStyleTag({path:'dist/framework/official-ui/style.css'});
 const lab = await page.evaluateHandle(async () => {
  const load = (path:string) => import(/* @vite-ignore */ path);
  const {startTheme}:typeof import('../../../../src/theme/controller') = await load('/src/theme/controller.ts');
  const {headerWeather}:typeof import('../../../../framework/official-ui/weather') = await load('/framework/official-ui/weather.ts');
  const {nativeNavigation}:typeof import('../../../../framework/official-ui/navigation') = await load('/framework/official-ui/navigation.ts');
  const {precipitationPhase}:typeof import('../../../../framework/motion/precipitation-phase') = await load('/framework/motion/precipitation-phase.ts');
  const {createPrecipitation}:typeof import('../../precipitation') = await load('/prototypes/host5/precipitation.ts');
  let now = 1000;
  const phase = precipitationPhase(()=>now);
  const input = {precipitation:'rain',name:'rain',dayState:'day'};
  Object.assign(window,{Weather:input});
  startTheme();
  const owner = headerWeather(phase), nav = nativeNavigation(owner);
  nav.refresh();
  const peer = document.querySelector('#passages canvas')!;
  if (!peer) throw Error('Reference surface missing');
  const reference = createPrecipitation(document.querySelector<HTMLElement>('.dgp-host')!,'svg');
  // Observe the existing material's first rim stroke on each new Canvas.
  // Read actual pixels after stroke(), before a later frame can repair the image.
  const colors = new WeakMap<CanvasGradient,number>(), first = new WeakMap<HTMLCanvasElement,{alpha:number;painted:boolean}>();
  const stop = CanvasGradient.prototype.addColorStop, stroke = CanvasRenderingContext2D.prototype.stroke;
  CanvasGradient.prototype.addColorStop = function(offset,color) {
   const rim = 'rgba(184,209,214,';
   if (offset === 0 && color.startsWith(rim)) colors.set(this,Number(color.slice(rim.length,-1)));
   stop.call(this,offset,color);
  };
  CanvasRenderingContext2D.prototype.stroke = function(...args:[]|[Path2D]) {
   Reflect.apply(stroke,this,args);
   const alpha = this.strokeStyle instanceof CanvasGradient ? colors.get(this.strokeStyle) : undefined;
   if (alpha === undefined || first.has(this.canvas) || !this.canvas.closest('#dol-midnight-controls')) return;
   const pixels = this.getImageData(0,0,this.canvas.width,4).data;
   first.set(this.canvas,{alpha,painted:pixels.some((v,i)=>i%4===3 && v>0)});
  };
  input.precipitation = input.name = 'snow'; nav.refresh();
  return {
   at(t:number){
    now = 1000+t;
    const sample=phase.sample(); reference.paint(sample.time,sample);
    const [rain,snow]=document.querySelectorAll('.dgp-host .host5-precipitation g');
    return {rain:Number(rain!.getAttribute('fill-opacity'))/.75,snow:Number(snow!.getAttribute('fill-opacity'))/.85};
   },
   firstPaint(){const canvas = document.querySelector<HTMLCanvasElement>('#dol-midnight-controls canvas')!; return first.get(canvas)},
   state(){const snap=owner.snapshot();return {ids:snap.surfaces.map(s=>s.id).sort(),polls:snap.activePolls,
    peerSame:peer.isConnected && peer===document.querySelector('#passages canvas'),peerPaused:snap.surfaces.find(s=>s.id==='passage')?.state?.paused}},
   finish(){reference.dispose(); nav.dispose(); CanvasGradient.prototype.addColorStop=stop; CanvasRenderingContext2D.prototype.stroke=stroke;
    return {surfaces:owner.snapshot().surfaces.length,polls:owner.snapshot().activePolls}}
  };
 });
 const opener = page.locator('#dol-midnight-sidebar-button');
 for (const elapsed of [225,315]) {
  const reference = await lab.evaluate((l,t)=>l.at(t),elapsed);
  assert.equal(reference.snow,elapsed/450); assert.equal(reference.rain,1-reference.snow);
  await opener.click();
  const canvas = page.locator('#dol-midnight-controls canvas.sf-weather-canvas');
  await canvas.waitFor();
  const drawing = await lab.evaluate(l=>l.firstPaint());
  assert.ok(drawing?.painted,'first settings rim must change Canvas pixels');
  const expected = reference.rain*(1-.8*reference.snow)*.28 + reference.snow*.3;
  assert.ok(Math.abs(drawing.alpha-expected)<1e-6,`first rim alpha ${drawing.alpha}, expected ${expected}`);
  await page.keyboard.press('Escape'); await canvas.waitFor({state:'detached'});
  await page.locator('#dol-midnight-controls').waitFor({state:'hidden'});
  assert.ok(await opener.evaluate(el=>el===document.activeElement));
  assert.deepEqual(await lab.evaluate(l=>l.state()),{ids:['passage'],polls:1,peerSame:true,peerPaused:false});
  console.log(browser.version(),elapsed,reference,drawing);
 }
 assert.deepEqual(await lab.evaluate(l=>l.finish()),{surfaces:0,polls:0});
 assert.deepEqual(errors,[]);
} finally {await browser.close(); await server.close()}
