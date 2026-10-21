import './scene.css';
const variant=new URLSearchParams(location.search).get('variant')==='old'?'old':'new';
const requested=new URLSearchParams(location.search).get('revision');
const revision=requested==='v1'||requested==='v2'||requested==='v2.1'?requested:'v2.2';
document.documentElement.setAttribute('data-stone-free','research');
document.documentElement.dataset.variant=variant;
document.getElementById('app')!.innerHTML=`<header class="study-header"><span>SOFT & WET · SETTINGS STUDY 02</span><strong>${variant==='old'?'旧版 3.0.4':revision==='v1'?'参考 V1 · 原始慢节奏':`候选 ${revision.toUpperCase()} · 折光聚合与层叠展开`}</strong><small>同视口 · 原速 · 受控真实设置组件 · 非游戏整合</small></header>
<main class="study-world"><p class="study-kicker">ACRYLIC / REFRACTION</p><h1>光线汇拢，<br>界面徐徐展开。</h1><p>从输入的落点，到玻璃面的生成，再到内容的层叠交接。<br>观察材质、节奏与连续操作时的接续。</p><div id="overlayButtons"></div><div class="study-card"><span>SETTINGS / WORKSPACE</span><h2>同一个阅读空间</h2><p>保留现有设置内容、偏好和 3.x Acrylic 身份。此场景不会运行游戏或读取玩家存档。</p><div class="study-lines"></div></div></main>
<footer class="study-caption"><b id="operation">准备</b><span id="elapsed">0.00 s</span><span>1× 原速</span></footer>`;
const root=window as NonNullable<Parameters<(typeof import('./old'))['startTheme']>[0]>;
const {startTheme}=await(variant==='old'?import('./old'):import('./new'));
startTheme(root);
const operations:Array<{action:string;at:number;wallTime:number}>=[];
function mark(action:string){operations.push({action,at:performance.now(),wallTime:performance.timeOrigin+performance.now()});document.getElementById('operation')!.textContent=action}
function act(action:string){
 mark(action);
 if(action==='打开设置'||action==='关闭中重新打开'){const button=document.getElementById('dol-midnight-sidebar-button');if(button&&!document.querySelector('dialog[open]'))button.focus();root.DoLMidnightTheme?.openSettings();return}
 if(action==='关闭设置'||action==='展开中关闭'){document.querySelector<HTMLButtonElement>('.dmt-close')?.click();return}
 if(action.startsWith('切换：')){const text=action.slice(3);[...document.querySelectorAll<HTMLButtonElement>('.dmt-workspace-nav button')].find(n=>n.textContent?.trim()===text)?.click();return}
 if(action==='切换阅读间距')document.querySelector<HTMLInputElement>('input[aria-label="舒适阅读间距"]')?.click();
}
const motionEvidence=variant==='new'?(await import('./refraction')).evidence:[];
Object.assign(window,{settingsStudy:{variant,revision:variant==='old'?'3.0.4':revision,act,operations,motionEvidence,preferences:()=>root.DoLMidnightTheme?.getPreferences(),destroy:()=>root.DoLMidnightTheme?.destroy(),mount:()=>startTheme(root)}});
let start=performance.now();const clock=()=>{document.getElementById('elapsed')!.textContent=((performance.now()-start)/1000).toFixed(2)+' s';requestAnimationFrame(clock)};clock();
const parentOrigin=document.referrer?new URL(document.referrer).origin:location.origin;
const localParent=()=>{const url=new URL(parentOrigin);return ['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol===location.protocol&&url.port===location.port};
window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==parentOrigin||!localParent())return;if(event.data?.type==='study-action')act(event.data.action);if(event.data?.type==='study-clock'&&Number.isFinite(event.data.epoch))start=event.data.epoch-performance.timeOrigin});
window.addEventListener('pagehide',()=>root.DoLMidnightTheme?.destroy(),{once:true});
document.getElementById('dol-midnight-sidebar-button')?.addEventListener('click',()=>mark('打开设置（手动）'));
