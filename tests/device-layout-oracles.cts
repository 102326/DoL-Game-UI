import assert = require('node:assert/strict');
import type {Page} from 'playwright';
type Profile=Pick<ReturnType<typeof import('./device-profiles.cjs')['buildCases']>[number],'viewport'|'deviceScaleFactor'|'safeArea'>;
interface SurfaceSpec {selector:string;inside?:boolean;safe?:boolean;noOverflow?:boolean;hittable?:boolean}
function requireLayout(ok:unknown, code:string, detail:unknown):asserts ok { assert.ok(ok, `${code}: ${JSON.stringify(detail)}`); }
async function layoutSnapshot(page:Page, specs:SurfaceSpec[] = []) {
  return page.evaluate(specs => {
    const rect = (n:Element) => { const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    const root=document.documentElement, css=getComputedStyle(root), vv=visualViewport;
    const insetNode=document.querySelector('#device-safe-area');if(!insetNode)throw Error('Missing device safe area fixture');
    const inset=getComputedStyle(insetNode),padding=(side:string)=>parseFloat(inset.getPropertyValue('padding-'+side))||0;
    const businessCalls:unknown=Reflect.get(window,'businessCalls');
    return {
      environment:{innerWidth,innerHeight,dpr:devicePixelRatio,visualViewport:vv?{width:vv.width,height:vv.height,scale:vv.scale,offsetLeft:vv.offsetLeft,offsetTop:vv.offsetTop}:null,root:{fontScale:parseFloat(css.getPropertyValue('--dgu-font-scale')||'1'),buttonScale:parseFloat(css.getPropertyValue('--dgu-button-scale')||'1'),fontSize:parseFloat(css.fontSize),transform:css.transform,zoom:css.zoom},safeArea:{top:padding('top'),right:padding('right'),bottom:padding('bottom'),left:padding('left')}},
      rootWidth:root.scrollWidth,rootClientWidth:root.clientWidth,
      surfaces:specs.map(spec=>{const n=document.querySelector(spec.selector);if(!n)return {...spec,missing:true as const};const r=rect(n),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),style=getComputedStyle(n);return {...spec,rect:r,hit:!!hit&&(n===hit||n.contains(hit)),hitTag:hit?.tagName,hitClass:typeof hit?.className==='string'?hit.className.slice(0,100):null,disabled:'disabled' in n&&!!n.disabled,display:style.display,visibility:style.visibility,transform:style.transform,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,viewBoxes:[...n.querySelectorAll('svg[viewBox]')].slice(0,8).map(s=>s.getAttribute('viewBox')??'')};}),
      businessCalls:businessCalls||0
    };
  }, specs);
}
function assertLayout(snapshot:Awaited<ReturnType<typeof layoutSnapshot>>, profile:Profile) {
  const e=snapshot.environment;
  requireLayout([e.innerWidth,e.innerHeight,e.dpr,...(e.visualViewport?Object.values(e.visualViewport):[])].every(Number.isFinite),'DEVICE_NONFINITE',e);
  requireLayout(e.innerWidth===profile.viewport.width&&e.innerHeight===profile.viewport.height&&Math.abs(e.dpr-profile.deviceScaleFactor)<.001,'DEVICE_ENVIRONMENT',{expected:profile.viewport,dpr:profile.deviceScaleFactor,actual:e});
  requireLayout(e.root.fontScale===1&&e.root.buttonScale===1&&e.root.transform==='none'&&Number(e.root.zoom)===1&&Math.abs((e.visualViewport?.scale??1)-1)<.001,'DEVICE_SCALE',e);
  requireLayout(snapshot.rootWidth<=snapshot.rootClientWidth+1,'DEVICE_ROOT_OVERFLOW',{rootWidth:snapshot.rootWidth,rootClientWidth:snapshot.rootClientWidth,innerWidth:e.innerWidth});
  for(const side of ['top','right','bottom','left'] as const)requireLayout(Math.abs(e.safeArea[side]-(profile.safeArea?.[side]||0))<1,'DEVICE_SAFE_AREA',{expected:profile.safeArea,actual:e.safeArea});
  for(const s of snapshot.surfaces){
    requireLayout(!('missing' in s&&s.missing)&&'rect' in s,'DEVICE_MISSING',{selector:s.selector});
    requireLayout(Object.values(s.rect).every(Number.isFinite)&&s.viewBoxes.every(v=>v.trim().split(/[\s,]+/).length===4&&v.trim().split(/[\s,]+/).every(x=>Number.isFinite(Number(x)))),'DEVICE_NONFINITE',s);
    requireLayout(s.rect.width>0&&s.rect.height>0&&s.display!=='none'&&s.visibility!=='hidden','DEVICE_HIDDEN',s);
    if(s.inside){const inset=s.safe?e.safeArea:{top:0,right:0,bottom:0,left:0};requireLayout(s.rect.x>=inset.left-1&&s.rect.y>=inset.top-1&&s.rect.x+s.rect.width<=e.innerWidth-inset.right+1&&s.rect.y+s.rect.height<=e.innerHeight-inset.bottom+1,'DEVICE_BOUNDS',s);}
    if(s.noOverflow)requireLayout(s.scrollWidth<=s.clientWidth+1,'DEVICE_SURFACE_OVERFLOW',s);
    if(s.hittable)requireLayout(s.hit&&!s.disabled,'DEVICE_HIT',s);
  }
  requireLayout(snapshot.businessCalls===0,'DEVICE_BUSINESS_DISPATCH',snapshot.businessCalls);
}
export = {layoutSnapshot,assertLayout};
