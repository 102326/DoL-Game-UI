import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
const output=path.resolve('tests/artifacts/evolution/weather-dist');
const allowed=(name:string)=>/^snow-(current|feather|powder)-(1x\.mp4|steady\.png|closeup\.png)$/.test(name)||name==='snow-evidence.json'||/^shower-(before|after)-(light|normal|heavy|severe|snow)\.png$/.test(name)||/^shower-(before|after)-1x\.mp4$/.test(name)||/^shower-(before|after)-result\.json$/.test(name)||/^shower-pixels-(on|off)\.png$/.test(name)||/^climate-(clear|light|normal|heavy|severe|snow-transition|snow|return|material-day|material-night)\.png$/.test(name)||name==='climate-1x.mp4'||/^(v1|beads|film|glass)-(clear|rain|snow)\.png$/.test(name)||/^(v1|beads|film|glass|contact)-1x\.mp4$/.test(name)||/^(contact-(before|after)|material-(day|night|dark)|displacement-(on|off))\.png$/.test(name)||name==='result.json'||/^(wet-trail|wet-path-on|wet-path-off|runoff-steady|runoff-bottom-visible|runoff-bottom-hidden)\.png$/.test(name);
const reviews=[{route:'snow-review',source:'docs/media/evolution-snow-r11'},{route:'review',source:'docs/media/evolution-weather-r2'},{route:'rain-review',source:'docs/media/evolution-weather-r3'},{route:'trail-review',source:'docs/media/evolution-weather-r4'},{route:'trail-baseline',source:'docs/media/evolution-weather-r4-baseline'},{route:'runoff-review',source:'docs/media/evolution-weather-r5'},{route:'runoff-baseline',source:'docs/media/evolution-weather-r5-baseline'},{route:'climate-review',source:'docs/media/evolution-weather-r6'},{route:'climate-baseline',source:'docs/media/evolution-weather-r6-baseline'},{route:'shower-review',source:'docs/media/evolution-weather-r7'},{route:'rain-force-review',source:'docs/media/evolution-weather-r8'},{route:'scatter-review',source:'docs/media/evolution-weather-r9'}];
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
 build:{outDir:output,emptyOutDir:true,target:'es2022',rollupOptions:{input:{snowReview:path.resolve('prototypes/evolution-weather/snow-review.html'),snowLab:path.resolve('prototypes/evolution-weather/snow-lab.html'),scatterReview:path.resolve('prototypes/evolution-weather/scatter-review.html'),rainForceReview:path.resolve('prototypes/evolution-weather/rain-force-review.html'),showerReview:path.resolve('prototypes/evolution-weather/shower-review.html'),climateReview:path.resolve('prototypes/evolution-weather/climate-review.html'),runoffReview:path.resolve('prototypes/evolution-weather/runoff-review.html'),trailReview:path.resolve('prototypes/evolution-weather/trail-review.html'),index:path.resolve('prototypes/evolution-weather/index.html'),compare:path.resolve('prototypes/evolution-weather/compare.html'),rainReview:path.resolve('prototypes/evolution-weather/rain-review.html'),optics:path.resolve('prototypes/evolution-weather/optics.html'),glassOptics:path.resolve('prototypes/evolution-weather/glass-optics.html')}}}
});
