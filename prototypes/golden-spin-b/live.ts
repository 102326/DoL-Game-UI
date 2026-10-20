import {goldenSpin,type Options} from './controller';
import './motion.css';
let active:ReturnType<typeof goldenSpin>|undefined;
let controls:HTMLElement|undefined;
/** Explicit developer opt-in, never auto-installs or replaces a running Hub. */
export function start(options:Partial<Options>={}) {
 if(active)throw Error('Stop the prototype before starting another instance');
 const roots=[...document.querySelectorAll<HTMLElement>('.sf-motion-hub[data-official]')];
 if(roots.length!==1||!roots[0].querySelector('.sf-motion-orbit.is-grid'))throw Error('Expected one current official grid Hub');
 active=goldenSpin(roots[0],options);return active;
}
export function stop(){active?.destroy();active=undefined}
export const inspect=()=>active?.inspect()??null;
export const configure=(options:Partial<Options>)=>active?.configure(options);
export function showControls(){
 if(controls)return;
 const panel=document.createElement('aside');panel.setAttribute('aria-label','Golden Spin B 实验控制');panel.dataset.goldenSpinControls='';
 panel.style.cssText='position:fixed;bottom:14px;left:14px;z-index:20000;max-width:calc(100vw - 28px);width:260px;padding:12px 14px;background:rgba(24,26,29,.9);border:1px solid #ffffff22;border-radius:14px;color:#ddd;font:12px/1.7 system-ui;box-shadow:0 10px 35px #0006;backdrop-filter:blur(20px)';
 panel.innerHTML='<details><summary style="cursor:pointer">Golden Spin B · 实验控制</summary><label><input type="checkbox" checked> 启用原型（关闭即恢复）</label><br><label>引擎 <select><option value="gsap">GSAP</option><option value="waapi">WAAPI 对照</option></select></label><br><label>时长 <input type="range" min="1" max="2.8" step=".05" value="1.65"></label><p style="margin:5px 0;color:#999">未替换安装包，不修改游戏业务。</p></details>';
 const toggle=panel.querySelector<HTMLInputElement>('input[type=checkbox]')!,engine=panel.querySelector<HTMLSelectElement>('select')!,duration=panel.querySelector<HTMLInputElement>('input[type=range]')!;
 const options=()=>({engine:engine.value as Options['engine'],duration:Number(duration.value)});
 toggle.onchange=()=>{if(toggle.checked){try{start(options())}catch{toggle.checked=false}}else stop()};
 engine.onchange=duration.oninput=()=>configure(options());
 document.body.append(panel);controls=panel;
}
export function dispose(){stop();controls?.remove();controls=undefined}
