import '../../src/main';
import '../../src/theme/stone-free.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-pages.css';
import '../../src/theme/kraft-work-motion.css';
import '../../src/theme/navigation-material.css';
import '../evolution42-study04/style.css';
import './attributes-material.css';
import {startTheme} from '../../src/theme/controller';
import Navigation from '../../src/characteristics/Navigation.vue';
import {nativeOverlayNavigation} from '../../src/ui/native-overlay-navigation';
import {startCharacteristics} from '../../src/characteristics/main';
import {nativeNavigation} from '../../framework/official-ui/navigation';
import {visualScope} from '../../src/ui/visual-scope';
import {attributesMaterialStudy} from './attributes-material-study';

const root:NonNullable<Parameters<typeof startTheme>[0]>=window;
startTheme(root);const theme=(()=>{const value=root.DoLMidnightTheme;if(!value)throw Error('Missing actual theme');return value})();
const scope=visualScope();
const variant=new URLSearchParams(location.search).get('variant')==='baseline'?'baseline':'study';
const legacy=new URLSearchParams(location.search).has('legacyTarget');
const attributes=variant==='study'&&!legacy?startCharacteristics(window):nativeOverlayNavigation(window,{kind:'characteristics',prefix:'dgc',marker:'characteristics-display',claimKey:'characteristics-navigation-life',groups:[['base-characteristics','基础属性'],['base-skills','生活技能'],['school-grades','学业'],['prof','武器技能']],component:Navigation}),navigation=nativeNavigation();
let shell:HTMLElement,study:ReturnType<typeof attributesMaterialStudy>|undefined,actions=0,disposed=false;
const node=<T extends HTMLElement>(selector:string)=>{const n=document.querySelector<T>(selector);if(!n)throw Error('Missing '+selector);return n};
function weather(value:string){Object.assign(window,{Weather:{name:value,precipitation:value==='snow'?'snow':value==='rain'?'rain':'none',precipitationIntensity:1.7,dayState:'day'}});navigation.refresh()}
function sync(){
 if(disposed)return;
 attributes.refresh();navigation.refresh();
 const owned=shell.isConnected&&!shell.classList.contains('hidden')&&shell.dataset.overlay==='characteristics'&&!!shell.querySelector(':scope>.dgc-host');
 if(!owned){study?.dispose();study=undefined;return}
 if(legacy&&!study)study=attributesMaterialStudy(shell,node('#customOverlayTitle'),node('#customOverlayContent'),shell);
}
function close(){shell.classList.add('hidden');sync()}
function create(){
 study?.dispose();study=undefined;document.getElementById('customOverlay')?.remove();
 shell=document.createElement('section');shell.id='customOverlay';shell.dataset.overlay='characteristics';shell.setAttribute('aria-label','属性研究窗口');
 shell.innerHTML='<header id="customOverlayTitle"><strong>属性</strong><button id="close" aria-label="关闭属性">×</button></header><div id="overlayTabs"><button class="link-internal macro-button tab-selected">属性</button><button class="link-internal macro-button">社交</button></div><div id="customOverlayContent"><div id="characteristics-display"></div></div>';
 const content=shell.querySelector<HTMLElement>('#customOverlayContent')!;
 const sections=[['base-characteristics','基础属性'],['base-skills','生活技能'],['school-grades','学业'],['prof','武器技能']];
 for(const [id,label] of sections){const section=document.createElement('section');section.id=id!;section.innerHTML='<h2>'+label+'</h2>';for(let i=0;i<6;i++){const card=document.createElement('div');card.className='characteristic-box';card.innerHTML='<h3>'+label+' · '+(i+1)+'</h3><p>用于检查正文、滚动和标题定位的合成内容，不读取游戏数据。</p>';section.append(card)}content.append(section)}
 const action=document.createElement('button');action.id='native-action';action.textContent='原生操作计数';action.onclick=()=>{actions++;node('#notice').textContent='原生操作 '+actions+' 次'};content.prepend(action);
 const top=Math.ceil(node('.study').getBoundingClientRect().bottom+12);shell.style.top=top+'px';shell.style.height=Math.max(200,Math.min(650,innerHeight-top-20))+'px';
 document.body.append(shell);node('#close').onclick=close;
 for(const button of shell.querySelectorAll<HTMLButtonElement>('#overlayTabs button'))button.onclick=()=>{shell.dataset.overlay=button.textContent==='属性'?'characteristics':'social';for(const n of shell.querySelectorAll('#overlayTabs button'))n.classList.toggle('tab-selected',n===button);sync()};
 sync();
}
const observer=new MutationObserver(()=>scope.frame(sync));scope.own(()=>observer.disconnect());observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-overlay','hidden']});
node('#open').onclick=()=>{if(disposed)return;shell.classList.remove('hidden');shell.dataset.overlay='characteristics';sync()};
node('#settings').onclick=()=>theme.openSettings();node('#rebuild').onclick=()=>{if(!disposed)create()};
node<HTMLSelectElement>('#weather').onchange=e=>weather((e.currentTarget as HTMLSelectElement).value);
function dispose(){if(disposed)return;disposed=true;study?.dispose();study=undefined;scope.dispose();navigation.dispose();attributes.destroy();theme.destroy();node('#notice').textContent='已停止；原生内容与操作保留'}
node('#dispose').onclick=dispose;window.addEventListener('pagehide',dispose,{once:true});scope.own(()=>window.removeEventListener('pagehide',dispose));
export const attributesPreview={variant,close,create,dispose,theme,counts:()=>({actions,disposed})};
Object.assign(window,{attributesPreview});
weather('clear');create();node('#notice').textContent=variant==='study'?'受力候选：拖动标题空白处；正式研发整合（尚未实机验收）':'现行窗口：同一材质与内容，保持原有固定位置';
