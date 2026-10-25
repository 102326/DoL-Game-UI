// Observe actual context acquisition; never creates a GL context or a product fallback.
interface Graphics {pages:number;contexts:Record<string,number>;failedContexts:Record<string,number>;webgl:{version:string;renderer:string;vendor:string}[];css:{backdrop:boolean;filter:boolean};errors:string[]}
interface Page {addInitScript(fn:()=>void):Promise<void>;evaluate<T>(fn:()=>T):Promise<T>;close:(...args:unknown[])=>Promise<unknown>}
interface Browser {newPage:(...args:unknown[])=>Promise<Page>;newContext:(...args:unknown[])=>Promise<Context>;close:(...args:unknown[])=>Promise<unknown>}
interface Context {newPage:(...args:unknown[])=>Promise<Page>;close:(...args:unknown[])=>Promise<unknown>}
interface Chromium {launch:(...args:unknown[])=>Promise<Browser>}
const graphics:Graphics={pages:0,contexts:{},failedContexts:{},webgl:[],css:{backdrop:false,filter:false},errors:[]};
const installed=new WeakSet<object>(),attached=new WeakSet<object>();
export function graphicsSnapshot():Graphics{return structuredClone(graphics);}
export function rendererProblems(expected:string[]|undefined,actual:unknown):string[]{
 const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
 const contexts=record(actual)&&record(actual.contexts)?actual.contexts:undefined;
 return (expected||[]).filter(kind=>{const count=contexts?.[kind];return typeof count!=='number'||!Number.isSafeInteger(count)||count<=0;}).map(kind=>'RendererPathMismatch:'+kind);
}
export function instrumentChromium(chromium:Chromium):void{
 if(installed.has(chromium))return;installed.add(chromium);
 const launch=chromium.launch;
 chromium.launch=async function(...args){const browser=await launch.apply(this,args),pages=new Set<Page>();
  const collect=async(page:Page)=>{try{
   const report=await page.evaluate(()=> (globalThis as typeof globalThis&{__moodyGraphics?:Graphics}).__moodyGraphics);
   if(!report)return;graphics.pages++;for(const key of ['contexts','failedContexts'] as const)for(const [name,count]of Object.entries(report[key]))graphics[key][name]=(graphics[key][name]||0)+count;
   for(const value of report.webgl)if(!graphics.webgl.some(g=>JSON.stringify(g)===JSON.stringify(value)))graphics.webgl.push(value);
   graphics.css.backdrop||=report.css.backdrop;graphics.css.filter||=report.css.filter;
  }catch(error){graphics.errors.push(String((error as Error).message).slice(0,200));}};
  const attach=async(page:Page)=>{if(attached.has(page))return page;attached.add(page);pages.add(page);
   await page.addInitScript(()=>{
    const host=globalThis as typeof globalThis&{__moodyGraphics?:Graphics};
    const report:Graphics={pages:1,contexts:{},failedContexts:{},webgl:[],css:{backdrop:CSS.supports('backdrop-filter','blur(1px)'),filter:CSS.supports('filter','url(#probe)')},errors:[]};host.__moodyGraphics=report;
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:unknown[]){
     const context=Reflect.apply(original,this,args),kind=String(args[0]),role=this.matches('.sf-weather-canvas,.evo-weather-canvas')?'weather':this.matches('.spin-hub-canvas')||this.closest('.sphere-stage,.sf-motion-hub')?'sphere':'other';
     const key=role+':'+kind,target=context?report.contexts:report.failedContexts;target[key]=(target[key]||0)+1;
     if(context&&/^webgl2?$/.test(kind)){const gl=context as WebGLRenderingContext,extension=gl.getExtension('WEBGL_debug_renderer_info');report.webgl.push({version:String(gl.getParameter(gl.VERSION)),renderer:String(gl.getParameter(extension?.UNMASKED_RENDERER_WEBGL||gl.RENDERER)).slice(0,200),vendor:String(gl.getParameter(extension?.UNMASKED_VENDOR_WEBGL||gl.VENDOR)).slice(0,200)});}
     return context;
    } as typeof original;
   });
   const close=page.close;page.close=async function(...args){await collect(page);pages.delete(page);return close.apply(this,args)};return page;
  };
  const newPage=browser.newPage;browser.newPage=async function(...args){return attach(await newPage.apply(this,args));};
  const newContext=browser.newContext;browser.newContext=async function(...args){const context=await newContext.apply(this,args),newPage=context.newPage,owned=new Set<Page>();context.newPage=async function(...args){const page=await attach(await newPage.apply(this,args));owned.add(page);return page;};const close=context.close;context.close=async function(...args){for(const page of owned)if(pages.has(page)){await collect(page);pages.delete(page);}owned.clear();return close.apply(this,args);};return context;};
  const close=browser.close;browser.close=async function(...args){for(const page of pages)await collect(page);pages.clear();return close.apply(this,args)};
  return browser;
 };
}
