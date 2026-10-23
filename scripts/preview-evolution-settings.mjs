import {createServer} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Review the real settings controller without game data or a second implementation.
export async function createSettingsPreviewServer(port=5192){
 const html=`<!doctype html><html lang="zh-CN" data-stone-free><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Evolution · 设置 V2.3 研发接线</title><link rel="stylesheet" href="/dist/framework/official-ui/style.css"><style>body{margin:0;min-height:160vh;background:radial-gradient(ellipse at 80% 10%,#3e5147,transparent 65%),#181e22;color:#e4e7e8;font:16px system-ui}#settings-demo{line-height:1.7;max-width:850px;margin:auto;padding:40px 24px}#settings-demo h1{font-size:30px}#settings-demo small{color:#b6c6bf}#overlayButtons{display:flex;gap:12px;margin:28px 0}#settings-demo button{font:inherit;border:1px solid #91b5a855;border-radius:10px;background:#32443c;color:inherit;padding:10px 18px;cursor:pointer}#settings-demo .sample{margin:28px 0;padding:24px;border:1px solid #c2d8cc25;border-radius:18px;background:#ffffff06}#settings-demo output{display:block;margin-top:16px}</style><body><main id="settings-demo"><small>SOFT & WET 4.0 · EVO-INT-S01</small><h1>界面设置 · V2.3 研发接线</h1><p>这里直接运行当前设置源码。开关只保留短透明度过渡，分类保留已认可的折叠与层叠效果。</p><div id="overlayButtons"></div><section class="sample"><h2>安静的午后</h2><p>正文是第一方模拟场景。设置保持真正的模态输入边界，关闭后可继续操作下方按钮。</p><button id="native">正文操作</button><output id="native-status" aria-live="polite">正文操作：0 次</output></section><p><small>本页不读取游戏或存档。研发接线、原型视觉认可、真实游戏与设备验收分别记录；不是正式发布版。</small></p></main><script type="module">import {startTheme} from '/src/theme/controller.ts';startTheme();let count=0;document.getElementById('native').onclick=()=>document.getElementById('native-status').textContent='正文操作：'+(++count)+' 次';</script></body></html>`;
 const server=await createServer({configFile:false,plugins:[vue(),{name:'evolution-settings-review',configureServer(s){s.middlewares.use((req,res,next)=>{if((req.url??'').split('?')[0]!=='/')return next();res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)})}}],server:{host:'127.0.0.1',port,strictPort:port!==0},logLevel:'error'});
 await server.listen();return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createSettingsPreviewServer();console.log('Actual settings review: http://127.0.0.1:'+server.httpServer.address().port);
}
