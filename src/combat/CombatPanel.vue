<script setup lang="ts">
import {ref,computed} from 'vue';
import type {CombatModel} from './types';
const props=defineProps<{model:CombatModel;onJump:(key:string)=>void;onClassic:()=>void}>();
const native=ref<HTMLElement>();
const dock=ref<HTMLElement>();
const summaryOpen=ref(false);
const currentGroup=computed(()=>props.model.activeKey||'');
function jump(key:string){props.onJump(key)}
function toggleSummary(){
 const opening=!summaryOpen.value;
 const menu=dock.value?.querySelector<HTMLElement>('#cbtToggleMenu.visible');
 if(opening&&menu){
  menu.querySelector<HTMLElement>('.cbtToggle')?.click();
  if(menu.classList.contains('visible'))return;
 }
 summaryOpen.value=opening;
}
function nativeMenuClick(event:MouseEvent){
 if(event.target instanceof Element&&event.target.closest('#cbtToggleMenu .cbtToggle'))summaryOpen.value=false;
}
defineExpose({native,dock});
</script>
<template>
 <section class="dcu-shell" aria-label="新版战斗面板" data-dcu-vue>
  <header class="dcu-header">
  <nav class="dcu-nav" aria-label="定位行动部位"><span>全部行动</span><button v-for="g in model.groups" :key="g.key" type="button" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key)">{{g.title}}</button></nav><button type="button" @click="onClassic">原版界面 ↗</button></header>
  <div class="dcu-workspace"><div ref="native" class="dcu-native"></div></div>
  <footer ref="dock" class="dcu-footer" aria-label="战斗操作栏" @click.capture="nativeMenuClick">
   <div class="dcu-summary-rail" aria-label="本回合摘要"><button v-for="g in model.groups" :key="g.key" type="button" :title="g.title+'：'+(g.selected||'暂无已选动作')" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key)"><span>{{g.title}}</span><strong>{{g.selected||'暂无已选动作'}}</strong></button></div>
   <aside v-if="summaryOpen" class="dcu-summary" aria-label="本回合选择"><div class="dcu-summary-header"><div class="dcu-summary-heading"><h3>本回合选择</h3><span>{{model.groups.length}} 组</span></div><p class="dcu-hint">点击部位定位，继续后执行。</p></div><div class="dcu-summary-list"><button v-for="g in model.groups" :key="g.key" type="button" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key);summaryOpen=false"><span>{{g.title}}</span><strong>{{g.selected||'暂无已选动作'}}</strong></button></div></aside>
   <button type="button" class="dcu-summary-toggle" :aria-expanded="summaryOpen" @click="toggleSummary">{{summaryOpen?'收起摘要':'选择摘要'}}<span>{{model.groups.length}}</span></button><div class="dcu-dock-native" aria-label="原生战斗操作"></div>
  </footer>
 </section>
</template>
