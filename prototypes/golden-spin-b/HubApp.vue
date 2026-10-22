<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref,nextTick} from 'vue';
import {createHost} from '../../framework/host';
import {mountVue} from '../../framework/vue';
import MotionHub from '../../framework/motion-hub/MotionHub.vue';
import type {MountHandle} from '../../framework/contracts';
import {sphereHub} from './hub-motion';

const mounted=ref(true),message=ref('点击侧边铁球展开工具'),zoom=ref(100);
let host= createHost(window),owner=host.register('SoftWetOfficialUI'),handle:Readonly<MountHandle>|undefined;
let controller:ReturnType<typeof sphereHub>|undefined,releases:(()=>void)[]=[],extra:(()=>void)|undefined;
let generation=0;
const names=[['interface-settings','界面设置'],['runtime-inspector','运行检查'],['native-saves','存档'],['native-social','社交'],['native-attributes','属性']] as const;
const calls=ref<string[]>([]);
function record(id:string){calls.value=[...calls.value.slice(-5),id];message.value='已打开工具：'+(names.find(x=>x[0]===id)?.[1]??id)+'（内容为样片演示）'}
async function mount(){
 const ticket=++generation;
 host.sceneReady();
 releases=names.map(([id,title])=>owner.provideView({id,title,setup(c){record(id);c.element.textContent=title+' · 演示内容，不执行游戏业务'}}));
 const current=mountVue(owner,{id:'golden-spin-lab',parent:document.body,lifetime:'persistent',load:()=>MotionHub,props:{host,officialPreferences:true,preferredMode:'grid',dismiss:()=>unmount(),experimentalMotion:(root:HTMLElement)=>{const instance=sphereHub(root);controller=instance;return instance.destroy}}});
 handle=current;await current.ready;await nextTick();if(ticket!==generation)return;
 const root=document.querySelector<HTMLElement>('.sf-motion-hub[data-official]');
 if(root){mounted.value=true;Object.assign(window,{goldenSpinLab:{controller,host,recorded:calls,unmount,remount,mountExtra,setZoom,settleScene}})}
}
function unmount(){generation++;controller?.destroy();controller=undefined;handle?.dispose();handle=undefined;extra?.();extra=undefined;releases.forEach(stop=>stop());releases=[];mounted.value=false}
async function remount(){unmount();await mount()}
function side(key:string){const b=document.querySelector<HTMLElement>('.sf-motion-ball');b?.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));b?.focus({preventScroll:true})}
function mountExtra(){if(extra){extra();extra=undefined}else extra=owner.provideView({id:'lab-extra',title:'动态工具',setup(c){c.element.textContent='新增公开视图'}})}
function setZoom(value:number){zoom.value=value;document.body.style.zoom=String(value/100);window.dispatchEvent(new Event('resize'));controller?.relayout()}
function settleScene(){host.invalidateScene();host.sceneReady();message.value='已模拟场景失效与重新就绪'}
onMounted(mount);
onBeforeUnmount(()=>{unmount();owner.dispose();host.dispose();document.body.style.removeProperty('zoom');delete (window as any).goldenSpinLab});
</script>
<template>
 <main class="gs-lab-shell">
  <header><p class="gs-eyebrow">SOFT & WET 4.0 · EVOLUTION</p><h1>Golden Spin <i>B</i></h1><p>铁球蓄势与释放，驱动工具展开与回收。</p><span class="gs-lab-tag">完整悬浮球 V2 · 中途可操作</span><a class="hub-preview-link" href="./index.html">已认可球体</a> · <a class="hub-preview-link" href="./windows.html">窗口与设置工作区</a></header>
  <section class="gs-lab-controls" aria-label="原型控制">
   <label>页面 CSS Zoom<select aria-label="页面缩放" :value="zoom" @change="setZoom(Number(($event.target as HTMLSelectElement).value))"><option :value="80">80%</option><option :value="100">100%</option><option :value="125">125%</option></select></label>
   <div class="gs-lab-actions"><button @click="side('ArrowLeft')">左侧停靠</button><button @click="side('ArrowRight')">右侧停靠</button><button @click="mountExtra">增减工具</button><button @click="settleScene">模拟 Passage 切换</button><button @click="mounted?unmount():remount()">{{mounted?'卸载原型':'重新挂载'}}</button></div>
  </section>
  <section class="gs-lab-scene" aria-label="模拟游戏阅读区"><small>演示场景 · 无玩家存档</small><h2>傍晚的街角</h2><p>街灯逐渐亮起，玻璃映出安静的光。你停下脚步，展开手边的工具。</p><div class="gs-lab-stats"><span>状态 <b>良好</b></span><span>时间 <b>18:40</b></span><span>天气 <b>多云</b></span></div><p>原型复用 3.0.4 的 MotionHub Vue 组件、网格／工具带和公开视图排序。工具按钮是真实节点，目标位置由原组件布局决定；这里的游戏文字、人物状态与工具内容均为模拟。</p><button @click="message='下层正文按钮仍可操作'">正文操作</button></section>
  <p class="gs-lab-status" role="status">{{message}}</p>
  <footer>可见工具无需等待整段演出结束；按下或键盘聚焦期间保持位置。连续点击球体可反向。拖动、Escape、方向键和原工具入口仍可使用。<br>这是独立样片，未替换正式 UI，未获准正式整合或发布 4.0。</footer>
 </main>
</template>
