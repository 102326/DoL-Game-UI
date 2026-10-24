import {startTheme} from '../../src/theme/controller';
import {headerWeather} from '../../framework/official-ui/weather';

const special=document.documentElement.hasAttribute('data-special-weather');
export const sample={name:'clear',precipitation:'none',dayState:'night',bloodMoon:false,temperature:20,Temperature:{isExtreme:()=>false}};
Object.assign(window,{sample,Weather:sample});
const root:NonNullable<Parameters<typeof startTheme>[0]>=window;
startTheme(root);
const theme=root.DoLMidnightTheme;if(!theme)throw Error('Missing weather preview settings');
const owner=headerWeather();
let skyLabel='';
export const openReview=()=>{
 theme.openSettings();
 const header=document.querySelector<HTMLElement>('.dmt-settings-header'),dialog=document.querySelector('dialog');
 if(!header||!dialog)throw Error('Missing weather preview dialog');
 const shell=header.closest<HTMLElement>('.dmt-settings-shell');if(!shell)throw Error('Missing weather preview shell');
 owner.set('settings',header,shell);owner.refresh();
 let caption=document.querySelector('#review-caption');
 if(!caption){caption=document.createElement('div');caption.id='review-caption';dialog.append(caption)}
 caption.textContent=skyLabel||'普通夜间 · 对照 | 原速 / 受控预览';
}
interface Sky {label:string;bloodMoon?:boolean;precipitation?:'rain'|'snow';alien?:boolean;temperature?:number;extreme?:boolean}
const skies:Record<string,Sky|undefined>={
 clear:{label:'普通夜间 · 对照'},blood:{label:'血月 · 已认可版本',bloodMoon:true},
 rain:{label:'雨中血月 · 普通雨滴与玻璃水珠',bloodMoon:true,precipitation:'rain'},
 normalRain:{label:'普通雨天 · 原有冷色雨',precipitation:'rain'},
 alien:{label:'异世界 · 紫色流云与星尘',alien:true},
 heat:{label:'极热 · 上升热流与暖反射',temperature:42,extreme:true},
 cold:{label:'严寒 · 冷雾与玻璃结晶',temperature:-22,extreme:true},
 snow:{label:'普通雪天 · 原有霜羽',precipitation:'snow'},
 alienRain:{label:'异世界＋雨 · 原有玻璃水珠',alien:true,precipitation:'rain'},
 coldSnow:{label:'严寒＋雪 · 原有霜羽与冷雾',temperature:-22,extreme:true,precipitation:'snow'}
};
export function setSky(kind:string){
 if(special){
  const sky=skies[kind];if(!sky)return;
  Object.assign(sample,{name:'clear',precipitation:'none',precipitationIntensity:0,bloodMoon:false,temperature:20},sky);
  if(sky.precipitation)Object.assign(sample,{name:sky.precipitation==='rain'?'rain':'snow',precipitationIntensity:2.2});
  sample.Temperature={isExtreme:()=>!!sky.extreme};
  Object.assign(window,{SugarCube:{State:{variables:{location:sky.alien?'tentworld':'town'}}}});
  skyLabel=sky.label+' | 原速 / 受控预览';
 }else{
  Object.assign(sample,{name:kind==='rain'?'rain':'clear',precipitation:kind==='rain'?'rain':'none',precipitationIntensity:kind==='rain'?2.2:0,bloodMoon:kind!=='clear'});
  const labels:Record<string,string|undefined>={clear:'普通夜间 · 对照',blood:'血月 · 月面、远云与近云遮蔽',rain:'雨中血月 · 保留玻璃水珠与斜雨'};
  skyLabel=labels[kind]+' | 原速 / 受控预览';
 }
 owner.refresh();Object.assign(window,{skyLabel});
 const caption=document.querySelector('#review-caption');if(caption)caption.textContent=skyLabel;
}
Object.assign(window,{theme,owner,openReview,setSky});
const open=document.querySelector<HTMLElement>('#open-review');if(!open)throw Error('Missing weather preview entry');open.onclick=openReview;
for(const button of document.querySelectorAll<HTMLElement>('[data-sky]'))button.onclick=()=>{const kind=button.dataset.sky;if(kind)setSky(kind)};
const keys:Record<string,string|undefined>={Digit1:'clear',Digit2:'blood',Digit3:'rain',...(special?{Digit0:'normalRain',Digit4:'alien',Digit5:'heat',Digit6:'cold',Digit7:'snow',Digit8:'alienRain',Digit9:'coldSnow'}:{})};
window.addEventListener('keydown',event=>{const kind=keys[event.code];if(event.altKey&&kind){event.preventDefault();setSky(kind)}},true);
window.addEventListener('pagehide',()=>{owner.dispose();theme.destroy()},{once:true});
