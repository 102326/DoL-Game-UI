import './snow-lab.css';
import {weatherSurface} from './renderer';
const query=new URLSearchParams(location.search);
type Mode='current'|'feather'|'powder';
const modes=['current','feather','powder'];let mode:Mode=modes.includes(query.get('snow')||'')?query.get('snow') as Mode:'feather';
const material=document.querySelector<HTMLElement>('#material')!,stage=document.querySelector<HTMLElement>('.stage')!,content=document.querySelector<HTMLElement>('#role-content')!;
const state={kind:'snow',night:false,rain:'heavy'} as const;let input:{kind:'clear'|'rain'|'snow';night:boolean;rain:'heavy'}={...state};
let renderer:ReturnType<typeof weatherSurface>|undefined,paused=false,role=query.get('role')||'reading';
const roles:Record<string,{title:string;html:string}>={
 reading:{title:'正文窗口 · 深底、清晰文本、边缘霜羽',html:'<span class="eyebrow">01 / READING SURFACE</span><h2>窗外渐冷，故事继续。</h2><div class="dmt-reading-sample"><p>雪落在窗沿。街灯隔着玻璃，留下柔和的光晕。你把目光重新移回书页，屋内的一切仍然清楚。</p><p>天气改变材质的边缘和光感，正文所在的区域保持安静。</p></div><footer><span>阅读样本 · 不写入游戏</span><button>继续阅读</button></footer>'},
 information:{title:'信息面板 · 分层信息、收敛的边缘天气',html:'<span class="eyebrow">02 / INFORMATION PANEL</span><h2>冬日概览</h2><p>重要信息优先，装饰退到边缘。</p><dl><div><dt>当前天气</dt><dd>雪 / 低温</dd></div><div><dt>今日安排</dt><dd>三项待办</dd></div><div><dt>环境状态</dt><dd>一切正常</dd></div></dl><footer><span>角色提案</span><button>查看详情</button></footer>'},
 tools:{title:'轻量工具 · 更小占地、控件净区、低干扰',html:'<span class="eyebrow">03 / TOOL OVERLAY</span><h2>随手工具</h2><p>薄层冷光，操作始终清楚。</p><div class="tool-grid"><button>快速导航 ↗</button><button>阅读偏好 Aa</button><button>布局整理 ⊞</button><button>收起面板 ×</button></div>'},
 drawer:{title:'操作抽屉 · 控件深底、底沿积雪、固定操作区',html:'<span class="eyebrow">04 / ACTION DRAWER</span><h2>调整你的界面</h2><p>高密度选项保持明确边界，按钮周围留白。</p><label>布局偏好<select><option>舒适阅读</option><option>紧凑排列</option></select></label><label>文字大小<input type="range" min="12" max="22" value="16"></label><div class="dmt-reading-sample">此处是长选项与说明文字的保护区。视觉效果不会经过确认按钮。</div><footer><button>取消</button><button>确认调整</button></footer>'},
 closeup:{title:'材质近景 · 无正文的观察样本，不能代替可读性检查',html:''}
};
function attach(){renderer?.dispose();const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');material.prepend(canvas);renderer=weatherSurface(canvas,()=>input,mode==='feather'?'glass-feather':mode==='powder'?'glass-powder':'glass-scatter');renderer.pause(paused);document.querySelector<HTMLAnchorElement>('#settings-link')!.href='./?candidate=glass&background=day&scatter=1&climate=1&snow='+mode;document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)))}
function setRole(value:string){role=roles[value]?value:'reading';material.dataset.role=role;content.innerHTML=roles[role]!.html;document.querySelector('#role-caption')!.textContent=roles[role]!.title;document.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.role===role)))}
function set(kind:'clear'|'rain'|'snow'){input={...input,kind};renderer?.refresh();document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weather===kind)))}
setRole(role);attach();set('snow');
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode as Mode;attach()});
document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach(b=>b.onclick=()=>set(b.dataset.weather as typeof input.kind));
document.querySelectorAll<HTMLButtonElement>('[data-role]').forEach(b=>b.onclick=()=>setRole(b.dataset.role!));
document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>{paused=!paused;renderer?.pause(paused);document.querySelector('#pause')!.textContent=paused?'继续动态':'静止观察'};
document.querySelector<HTMLButtonElement>('#light')!.onclick=()=>{stage.dataset.light=stage.dataset.light==='night'?'day':'night'};
Object.assign(window,{snowLab:{set,setRole,snapshot:()=>renderer?.snapshot(),pause:(value:boolean)=>{paused=value;renderer?.pause(value)},dispose:()=>renderer?.dispose(),reopen:()=>attach()}});
window.addEventListener('pagehide',()=>renderer?.dispose(),{once:true});
