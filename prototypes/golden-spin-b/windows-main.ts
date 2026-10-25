import {startTheme} from '../../src/theme/controller';
import {startOfficialMotion} from '../../framework/official-ui/motion';
import '../../src/tokens.css';
import '../../src/theme/controls.css';
import '../../src/theme/layout.css';
import '../../src/theme/kraft-work-surfaces.css';
import '../../src/theme/dark-acrylic.css';
import '../../src/theme/kraft-work-pages.css';
import '../../src/theme/kraft-work-motion.css';
import '../../src/theme/navigation-material.css';
import './lab.css';
import './windows.css';

document.documentElement.setAttribute('data-stone-free','research');
document.getElementById('app')!.innerHTML=`<main class="gs-lab-shell">
 <header><p class="gs-eyebrow">SOFT & WET · MOTION EVOLUTION / #22</p><h1>窗口与<i>交接</i></h1><p>窗口建立层次，内容保持稳定；分类沿阅读方向交接。</p><span class="gs-lab-tag">第一批 · 真实设置组件 · 视觉待验收</span></header>
 <nav class="motion-preview-links" aria-label="演示入口"><a href="./index.html">已认可球体</a><a href="./hub.html">完整悬浮球</a></nav>
 <section class="gs-lab-controls" aria-label="窗口演示控制">
  <div class="gs-lab-actions"><button id="show-settings">打开真实界面设置</button><button id="show-native">打开模拟原生面板</button><button id="toggle-animation" aria-pressed="true">交互动画</button><button id="lifecycle">卸载展示</button></div>
  <label>页面缩放<select id="zoom" aria-label="页面缩放"><option value="1">100%</option><option value=".8">80%</option><option value="1.25">125%</option></select></label>
  <p>原生窗口与设置共用 100ms 打开／80ms 背景退场；原生关闭动作保持即时。</p>
 </section>
 <section class="gs-lab-scene"><small>独立演示 · 不运行游戏业务</small><h2>稳定的阅读空间</h2><p>设置使用真实控制器与 Vue 组件；模拟原生面板保留按钮节点和事件，用来查看材质、命中与收回。下方正文不因视觉动画移动。</p><button id="background-action">正文操作</button></section>
 <p id="window-status" role="status" class="gs-lab-status">可以打开设置，快速切换分类，再关闭或重新打开。</p>
 <footer>系统减少动态效果与 UI 动画开关有效。尚未进行游戏联合运行与真机性能验收；没有替换正式发行。</footer>
 </main><div id="native-parent"><section id="customOverlay" class="hidden dgp-overlay" data-dgp-panel="settings" aria-label="模拟原生面板"><header id="customOverlayTitle"><h2>原生面板 · 演示</h2><button id="close-native">关闭面板</button></header><nav class="dgp-host"><button id="native-action">原有操作</button></nav><div id="customOverlayContent"><p>按钮节点不被克隆，动画不代替或重放业务事件。</p><p>短过渡保持实际窗口原坐标；窄屏和缩放下仍可操作。</p></div></section></div>`;
const root=window as NonNullable<Parameters<typeof startTheme>[0]>;
const button=(id:string)=>document.getElementById(id)! as HTMLButtonElement;
const overlay=document.getElementById('customOverlay')!,status=document.getElementById('window-status')!;
let stop:(()=>void)|undefined,live=false,calls=0,preferences:MutationObserver|undefined;
function syncControls(){button('toggle-animation').setAttribute('aria-pressed',String(!!root.DoLMidnightTheme?.getPreferences().visualMotion));for(const id of ['show-settings','show-native','toggle-animation'])button(id).disabled=!live}
function mount(){if(live)return;startTheme(root);stop=startOfficialMotion();live=true;button('lifecycle').textContent='卸载展示';preferences=new MutationObserver(syncControls);preferences.observe(document.documentElement,{attributes:true,attributeFilter:['data-dgu-visualmotion']});syncControls()}
function destroy(){if(!live)return;stop?.();stop=undefined;preferences?.disconnect();preferences=undefined;root.DoLMidnightTheme?.destroy();overlay.classList.add('hidden');live=false;button('lifecycle').textContent='重新挂载';syncControls()}
button('show-settings').onclick=()=>root.DoLMidnightTheme?.openSettings();
button('show-native').onclick=()=>{if(live)overlay.classList.remove('hidden')};
button('close-native').onclick=()=>overlay.classList.add('hidden');
button('native-action').onclick=button('background-action').onclick=()=>{calls++;status.textContent=`原有操作已执行 ${calls} 次（演示计数，不执行游戏业务）`};
button('toggle-animation').onclick=()=>{const enabled=!root.DoLMidnightTheme?.getPreferences().visualMotion;root.DoLMidnightTheme?.setPreference('visualMotion',enabled);syncControls()};
button('lifecycle').onclick=()=>live?destroy():mount();
document.getElementById('zoom')!.onchange=event=>{document.body.style.zoom=(event.target as HTMLSelectElement).value;window.dispatchEvent(new Event('resize'))};
Object.assign(window,{motionWorkspace:{mount,destroy,open:()=>root.DoLMidnightTheme?.openSettings(),calls:()=>calls}});
mount();
window.addEventListener('pagehide',destroy,{once:true});
