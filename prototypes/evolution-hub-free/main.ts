import {createHost} from '../../framework/host';
import {startTheme} from '../../src/theme/controller';
import {startFloatingTools} from '../../src/floating/main';
import {startOfficialHub} from '../../framework/official-ui/hub';
import {startFreeHub} from './owner';
import {isolateStorage} from './storage';
const requested=new URLSearchParams(location.search).get('variant');
const variant=requested==='baseline'?'baseline':requested==='direct'?'direct':'free';
const storage=isolateStorage(variant);
const root:NonNullable<Parameters<typeof startTheme>[0]>=window;startTheme(root);const theme=root.DoLMidnightTheme;if(!theme)throw Error('Missing theme');
const floating=startFloatingTools(window,false),host=createHost(window),owner=host.register('SoftWetOfficialUI');host.sceneReady();
let calls=0;const notice=document.getElementById('notice')!;for(const b of document.querySelectorAll('[data-native]'))b.addEventListener('click',()=>{calls++;notice.textContent=`原生动作 ${calls} 次：${b.textContent}`});
Object.assign(window,{DoLGameUI:{openSettings:()=>theme.openSettings(),ui:{openInspector:()=>{notice.textContent='受控运行检查'}}}});
const stop=variant==='baseline'?startOfficialHub(host,owner):startFreeHub(host,owner,variant==='free');
document.getElementById('mode')!.textContent=variant==='free'?'自由放置＋边缘蓄力研究':variant==='direct'?'上一轮：仅自由放置':'现役对照：松手返回侧边';
document.getElementById('restore')!.onclick=()=>{floating.show();document.dispatchEvent(new Event('dol-floating-reset'))};
const layout=document.getElementById('layout') as HTMLSelectElement;layout.value=floating.getPreferences().mode;layout.onchange=()=>floating.setPreference('mode',layout.value==='fan'?'fan':'grid');
let disposed=false;
export const hubFreePreview={host,owner,storage,calls:()=>calls,dispose(){
 if(disposed)return;disposed=true;
 // Retire page controls before restoring the real storage getter.
 document.getElementById('restore')!.onclick=null;layout.onchange=null;
 const errors:unknown[]=[];
 for(const release of [stop,()=>owner.dispose(),()=>host.dispose(),()=>floating.destroy(),()=>theme.destroy(),()=>Reflect.deleteProperty(window,'DoLGameUI'),()=>storage.restore()])try{release()}catch(error){errors.push(error)}
 if(errors.length)throw new AggregateError(errors,'Preview cleanup failed');
}};Object.assign(window,{hubFreePreview});
