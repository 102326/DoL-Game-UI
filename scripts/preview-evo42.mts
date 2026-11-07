import {createServer} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export async function createEvo42Server(port=5206){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const server=await createServer({root,configFile:false,cacheDir:path.join(root,'tests/artifacts/evo42/vite'),plugins:[vue(),tailwindcss(),{name:'evo42-home',configureServer(s){s.middlewares.use(async(req,res,next)=>{if((req.url??'').split('?')[0]!=='/')return next();try{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await s.transformIndexHtml('/',readFileSync(path.join(root,'prototypes/evolution42/index.html'),'utf8')))}catch(e){next(e)}})}}],define:{__STONE_FREE_CONSUMER__:true,__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false},server:{host:'127.0.0.1',port,strictPort:port!==0},logLevel:'error'});
 await server.listen();return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=await createEvo42Server();console.log('EVO42:',server.resolvedUrls?.local[0])}
