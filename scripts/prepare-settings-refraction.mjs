// Prototype-only source reconstruction. Never writes into production src/.
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve('tests/artifacts/settings-refraction-v1');
const refs={old:'915dcb9e85f3266a73a3e7ce38d769edd0c29ff4',new:'b507f1a7d18d4d77067fa0c793aea44d7de96b57'};
const sha=data=>createHash('sha256').update(data).digest('hex');
const manifest={scope:'Source reconstruction, not packaged game execution',refs,files:{}};
for(const [variant,ref]of Object.entries(refs)){
 const out=path.join(root,variant);mkdirSync(out,{recursive:true});
 const archive=execFileSync('git',['archive',ref,'src','framework'],{maxBuffer:30*1024*1024});
 execFileSync('tar',['-x','-C',out],{input:archive});
 const files=execFileSync('git',['ls-tree','-r','--name-only',ref,'src','framework'],{encoding:'utf8'}).trim().split('\n');
 manifest.files[variant]=Object.fromEntries(files.map(file=>[file,sha(readFileSync(path.join(out,file)))]));
}
const candidate=path.join(root,'new/src/theme');
const adapter=path.relative(candidate,path.resolve('prototypes/settings-refraction-v1/refraction')).split(path.sep).join('/');
let controller=readFileSync(path.join(candidate,'controller.ts'),'utf8');
const swap=(text,from,to)=>{if(text.split(from).length!==2)throw Error('Prototype source anchor changed: '+from.slice(0,80));return text.replace(from,to)};
controller=`import {createSettingsRefraction} from '${adapter}';\n`+controller;
controller=swap(controller,' const motion=sourceMotion();let transition=0,stage:HTMLElement|undefined;',' const refraction=createSettingsRefraction();\n const motion=sourceMotion();let transition=0,stage:HTMLElement|undefined;');
const begin=controller.indexOf(' function closeSettings(){'),end=controller.indexOf(' function nativeSettings(){');
if(begin<0||end<begin)throw Error('Controller open/close block missing');
controller=controller.slice(0,begin)+` function closeSettings(){
  if(!controls?.open||controls.hasAttribute('data-sf-leaving'))return;
  const ticket=++transition;controls.setAttribute('data-sf-leaving','');
  refraction.close(()=>{if(ticket===transition&&!destroyed)finishClose()});
 }
 function openSettings(){
  if(destroyed)return;mount();if(!controls)return;sync();
  ++transition;clearStage();controls.removeAttribute('data-sf-leaving');
  if(!controls.open){lastFocus=document.activeElement as HTMLElement;document.documentElement.setAttribute('data-dgu-settings-open','');if(supportsDialog())controls.showModal();else{controls.classList.add('dmt-modeless');controls.setAttribute('open','')}startGlass()}
  refraction.open(controls,settingsPanel()!,glass,lastFocus);
  controls.querySelector<HTMLButtonElement>('.dmt-close')?.focus({preventScroll:true});
 }
`+controller.slice(end);
controller=swap(controller,'motion.dispose();for(const attribute','refraction.dispose();motion.dispose();for(const attribute');
writeFileSync(path.join(candidate,'controller.ts'),controller);
let panel=readFileSync(path.join(candidate,'SettingsPanel.vue'),'utf8');
panel=swap(panel,"import {sourceMotion} from '../ui/source-motion';",`import {sourceMotion} from '../ui/source-motion';\nimport {refractPage,cancelRefractedPage,disposeRefractedPages} from '${adapter}';`);
const a=panel.indexOf('function transitionTask('),b=panel.indexOf('onBeforeUnmount(',a);
if(a<0||b<a)throw Error('Page transition block missing');
panel=panel.slice(0,a)+`function enterTask(element:Element,done:()=>void){refractPage(element as HTMLElement,direction,true,done)}
function leaveTask(element:Element,done:()=>void){refractPage(element as HTMLElement,direction,false,done)}
`+panel.slice(b);
panel=swap(panel,'onBeforeUnmount(()=>{layoutRevision++;','onBeforeUnmount(()=>{disposeRefractedPages();layoutRevision++;');
panel=swap(panel,'@enter="enterTask" @leave="leaveTask"','@enter="enterTask" @leave="leaveTask" @enter-cancelled="cancelRefractedPage" @leave-cancelled="cancelRefractedPage"');
writeFileSync(path.join(candidate,'SettingsPanel.vue'),panel);
manifest.patched={controller:sha(controller),panel:sha(panel)};
writeFileSync(path.join(root,'provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared immutable 3.0.4 and isolated b507-based settings candidate:',root);
