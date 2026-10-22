import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
const output=path.resolve('tests/artifacts/evolution/weather-dist');
const allowed=(name:string)=>/^(v1|beads|film|glass)-(clear|rain|snow)\.png$/.test(name)||/^(v1|beads|film|glass|contact)-1x\.mp4$/.test(name)||/^(contact-(before|after)|material-(day|night|dark)|displacement-(on|off))\.png$/.test(name)||name==='result.json';
const reviews=[{route:'review',source:'docs/media/evolution-weather-r2'},{route:'rain-review',source:'docs/media/evolution-weather-r3'}];
export default defineConfig({
 root:path.resolve('prototypes/evolution-weather'),
 plugins:[vue(),{name:'first-party-review-media',configureServer(server){
  for(const review of reviews)server.middlewares.use('/'+review.route+'/',(req,res,next)=>{
   const name=(req.url||'').split('?')[0].replace(/^\//,'');if(!allowed(name))return next();const file=path.resolve(review.source,name);if(!fs.existsSync(file))return next();
   res.setHeader('Content-Type',name.endsWith('.mp4')?'video/mp4':name.endsWith('.png')?'image/png':'application/json');fs.createReadStream(file).pipe(res);
  });
 },closeBundle(){
  // Each historical/current review has an explicit 16 MiB ceiling; no truncation on overflow.
  for(const review of reviews){const source=path.resolve(review.source);if(!fs.existsSync(source))continue;const files=fs.readdirSync(source).filter(allowed);
   if(files.reduce((n,f)=>n+fs.statSync(path.join(source,f)).size,0)>16*1024*1024)throw Error(review.route+' media exceeds explicit 16 MiB cap');
   const target=path.join(output,review.route);fs.mkdirSync(target,{recursive:true});for(const file of files)fs.copyFileSync(path.join(source,file),path.join(target,file));
  }
 }}],base:'./',define:{__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false},
 server:{host:'127.0.0.1',port:5190,strictPort:true,fs:{allow:[path.resolve('.')]}},
 build:{outDir:output,emptyOutDir:true,target:'es2022',rollupOptions:{input:{index:path.resolve('prototypes/evolution-weather/index.html'),compare:path.resolve('prototypes/evolution-weather/compare.html'),rainReview:path.resolve('prototypes/evolution-weather/rain-review.html'),optics:path.resolve('prototypes/evolution-weather/optics.html'),glassOptics:path.resolve('prototypes/evolution-weather/glass-optics.html')}}}
});
