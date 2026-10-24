import {defineConfig, type Plugin} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {createRequire} from 'node:module';
const {sourceIndex,inputs,root}:typeof import('./component-lab/source-index.cjs')=createRequire(import.meta.url)('./component-lab/source-index.cjs');
function sourceLink():Plugin{return {name:'lab-source-link',configureServer(server){
 server.middlewares.use((req,res,next)=>{if(req.url?.split('?')[0]!=='/__lab/source-index')return next();
  if(req.method!=='GET'){res.statusCode=405;return res.end()}
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  try{res.end(JSON.stringify(sourceIndex(new URL(req.url!, 'http://localhost').searchParams.get('component')||'shop.toolbar')))}catch{res.statusCode=503;res.end('{"status":"unavailable"}')}
 });
 },handleHotUpdate(ctx){if(inputs.some((p:string)=>ctx.file.replaceAll('\\','/').endsWith('/'+p)))ctx.server.ws.send({type:'custom',event:'lab:source-change',data:{changed:true}})}}}
export default defineConfig({root:root+'/component-lab',plugins:[vue(),tailwindcss(),sourceLink()],
 server:{host:'127.0.0.1',port:5175,strictPort:true,fs:{strict:true,allow:[root]}},
 build:{outDir:root+'/tests/artifacts/component-lab-dist',emptyOutDir:true}});
