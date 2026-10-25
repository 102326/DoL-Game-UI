import {createServer} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function specialPage(html:string){
 const controls='<button data-sky="normalRain">普通雨天</button><button data-sky="alien">异世界</button><button data-sky="heat">极热</button><button data-sky="cold">严寒</button><button data-sky="snow">普通雪天</button><button data-sky="alienRain">异世界＋雨</button><button data-sky="coldSnow">严寒＋雪</button>';
 return html.replace('Soft & Wet · 血月动态研究','Soft & Wet · 特殊天气动态预览')
  .replace('SOFT & WET · BLOOD MOON STUDY 01','SOFT & WET · SPECIAL WEATHER STUDY 01')
  .replace('直接运行当前设置组件和正式天气绘制。使用受控输入，不读取游戏或存档。','直接运行当前设置组件，预览异世界、极热和严寒。保留已认可血月与原有雨雪；全部使用受控输入，不读取游戏或存档。')
  .replace('<h1>血月 · 云层与玻璃</h1>','<h1>特殊天气 · 完整窗口预览</h1>')
  .replace('<p>窗口打开时：',controls+'<p>Alt+0 普通雨天 / Alt+4 异世界 / Alt+5 极热 / Alt+6 严寒 / Alt+7 雪 / Alt+8 异世界＋雨 / Alt+9 严寒＋雪。</p><p>窗口打开时：')
  .replace('其它特殊天气及运行包未修改','特殊天气仅本页注入，正式运行包未修改')
  .replace('</style>','#review-caption{max-width:calc(100vw - 40px);white-space:normal;text-align:center;width:max-content}</style>');
}

// Serve actual settings and production weather with controlled, local-only inputs.
export async function createBloodMoonPreview(port=5195,specials=false){
 const html=`<!doctype html><html lang="zh-CN" data-stone-free ${specials?'data-special-weather':''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soft & Wet · 血月动态研究</title><link rel="stylesheet" href="/dist/framework/official-ui/style.css"><style>body{margin:0;background:radial-gradient(ellipse at 75% 8%,#28313b,transparent 65%),#171b21;color:#e2e5e9;font:16px system-ui}#review-home{max-width:850px;margin:50px auto;padding:24px}#review-home button{padding:12px 18px;color:inherit;background:#252c34;border:1px solid #65717c66;border-radius:10px;font:inherit;margin:5px}#review-home p{line-height:1.8}body:has(dialog[open]) #review-home{visibility:hidden}#review-caption{position:fixed;bottom:5px;left:50%;transform:translateX(-50%);color:#ddd;background:#101318e8;border-radius:6px;padding:5px 12px;pointer-events:none;font:13px/1.5 system-ui;white-space:nowrap}</style></head><body><main id="review-home"><small>SOFT & WET · BLOOD MOON STUDY 01</small><h1>血月 · 云层与玻璃</h1><p>直接运行当前设置组件和正式天气绘制。使用受控输入，不读取游戏或存档。</p><button id="open-review">打开设置</button><button data-sky="clear">普通夜间</button><button data-sky="blood">血月</button><button data-sky="rain">雨中血月</button><p>窗口打开时：Alt+1 普通夜间 / Alt+2 血月 / Alt+3 雨中血月。真实设置控件仍可操作。</p><p>本页为受控本地验证，不是正式发行。</p></main><script type="module" src="/prototypes/evolution-integration/blood-moon-preview.ts"></script></body></html>`;
 const page=specials?specialPage(html):html;
 const server=await createServer({configFile:false,optimizeDeps:{entries:['prototypes/evolution-integration/blood-moon-preview.ts']},plugins:[vue(),{name:'blood-moon-page',configureServer(s){s.middlewares.use((req,res,next)=>{if((req.url??'').split('?')[0]!=='/')return next();res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page)})}}],server:{host:'127.0.0.1',port,strictPort:port!==0},logLevel:'error'});
 await server.listen();return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const specials=process.argv.includes('--special');const server=await createBloodMoonPreview(specials?5196:5195,specials);console.log('Weather study: http://127.0.0.1:'+String((server.httpServer!.address() as {port:number}).port));
}
