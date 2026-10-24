import {startTheme} from '../../src/theme/controller';

const weatherMode=new URLSearchParams(location.search).get('weather');
const sample={name:'clear',precipitation:'none',dayState:'day',precipitationIntensity:0};
if(weatherMode)Object.assign(window,{Weather:sample});
const root:NonNullable<Parameters<typeof startTheme>[0]>=window;
startTheme(root);
if(weatherMode){
 const {nativeNavigation}=await import('../../framework/official-ui/navigation');
 const navigation=nativeNavigation();
 const levels:Record<string,number|undefined>={light:.6,normal:0,heavy:1.7,severe:2.2};
 const previewWeather={set(kind:string){
  Object.assign(sample,{name:kind==='snow'?'snow':kind in levels?'rain':'clear',precipitation:kind==='snow'?'snow':kind in levels?'rain':'none',precipitationIntensity:levels[kind]??0});
  navigation.refresh();
 }};
 Object.assign(window,{previewWeather});
 const controls=document.createElement('p');
 controls.innerHTML='<button data-preview-weather="clear">晴天 · Alt+1</button> <button data-preview-weather="heavy">大雨 · Alt+2</button> <button data-preview-weather="snow">霜羽雪天 · Alt+3</button><small> 关闭设置后可点按钮；打开时可用Alt+1/2/3切换受控天气。仅本研究页。</small>';
 const heading=document.querySelector('#settings-demo h1');if(!heading)throw Error('Missing settings preview heading');heading.after(controls);
 controls.onclick=e=>{const kind=e.target instanceof Element?e.target.closest<HTMLElement>('[data-preview-weather]')?.dataset.previewWeather:undefined;if(kind)previewWeather.set(kind)};
 window.addEventListener('keydown',e=>{if(!e.altKey)return;const keys:Record<string,string|undefined>={Digit1:'clear',Digit2:'heavy',Digit3:'snow'},kind=keys[e.code];if(kind){e.preventDefault();previewWeather.set(kind)}},true);
 previewWeather.set(weatherMode);
 window.addEventListener('pagehide',()=>navigation.dispose(),{once:true});
}
let count=0;
const button=document.getElementById('native'),status=document.getElementById('native-status');
if(!button||!status)throw Error('Missing settings preview native controls');
button.onclick=()=>status.textContent='正文操作：'+(++count)+' 次';
