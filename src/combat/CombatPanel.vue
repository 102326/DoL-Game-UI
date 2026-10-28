<script setup lang="ts">
import {useWorkspaceSurface} from '../ui/workspace-surface';
import {ref,computed,watch,onBeforeUnmount} from 'vue';
import {workspaceEnterFrames} from '../ui/workspace-transition';
import {sourceMotion} from '../ui/source-motion';
import OrbitFocus from '../ui/OrbitFocus.vue';
const officialMotion=document.documentElement.hasAttribute('data-stone-free');
import type {CombatModel} from './types';
const props=defineProps<{model:CombatModel;onJump:(key:string)=>void;onClassic:()=>void;onMode?:()=>void}>();
const workspace=ref<HTMLElement>();useWorkspaceSurface(workspace,'combat');
const native=ref<HTMLElement>();
const dock=ref<HTMLElement>();
const summaryOpen=ref(false);
const currentGroup=computed(()=>props.model.activeKey||'');
const editing=computed(()=>props.model.groups.find(g=>g.key===currentGroup.value));
const heading=ref<HTMLElement>(),plane=ref<HTMLElement>(),motion=sourceMotion();
const activeIndex=computed(()=>Math.max(0,props.model.groups.findIndex(g=>g.key===currentGroup.value)));
watch(currentGroup,()=>{
 if(!props.model.focused)return;
 if(native.value)motion.animate(native.value,workspaceEnterFrames(1),620);
},{flush:'post'});
watch(()=>editing.value?.selected,(value,previous)=>{
 if(value===previous||!props.model.focused||!plane.value)return;
 motion.animate(plane.value,[{backgroundColor:'#92a6b119',boxShadow:'inset 2px 0 #92a6b177'},{backgroundColor:'#2020226b',boxShadow:'none'}],480);
},{flush:'post'});
onBeforeUnmount(()=>motion.dispose());
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
 <section ref="workspace" class="dcu-shell sf-material-main" :data-focused="model.focused||undefined" aria-label="新版战斗面板" data-dcu-vue>
  <header class="dcu-header">
  <nav v-if="!model.focused" class="dcu-nav dgu-orbit-nav" aria-label="定位行动部位"><OrbitFocus v-if="officialMotion" :active="currentGroup" selector="[aria-current=location]"/><span>全部行动</span><button v-for="g in model.groups" :key="g.key" type="button" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key)">{{g.title}}</button></nav><strong v-if="model.focused" class="dcu-round-title">当前安排 <small>选择后，继续执行回合</small></strong><div class="dcu-display-actions"><button v-if="model.focusAvailable" type="button" :aria-pressed="model.focused" @click="onMode?.()">{{model.focused?'全部展开':'聚焦编辑'}}</button><button type="button" @click="onClassic">原版界面 ↗</button></div></header>
  <div class="dcu-context" :data-phase="model.phase" aria-live="polite"><span>{{model.phase==='unavailable'?'当前无可用选项':`当前 ${model.groups.length} 组 · ${model.editedKeys?.length||0} 组本次更改 · 尚未执行`}}</span><span v-if="!model.focused">{{model.availableActions}} 个原生选项</span><span v-if="model.unknown">保留原版扩展内容</span><p v-if="model.message" role="status">{{model.message}}</p></div>
  <div class="dcu-workspace">
   <nav v-if="model.focused" class="dcu-arrangement dgu-orbit-nav" aria-label="当前安排"><OrbitFocus v-if="officialMotion" :active="currentGroup" selector="[aria-current=location]"/><button v-for="(g,index) in model.groups" :key="g.key" :style="{'--dcu-part-row':index+1+(index>activeIndex?1:0)}" :aria-expanded="currentGroup===g.key" aria-controls="dcu-focus-editor" :data-edit-group="g.key" type="button" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key)"><span>{{g.title}}</span><strong>{{g.selected||'未选择'}}</strong><small :data-edited="model.editedKeys?.includes(g.key)||undefined">{{model.editedKeys?.includes(g.key)?'本次更改 · 待执行':'沿用原选择'}}{{!g.known?' · 扩展':''}}</small></button></nav>
   <div id="dcu-focus-editor" class="dcu-editor sf-material-reading" :style="{'--dcu-edit-row':activeIndex+2}"><div v-if="model.focused" ref="plane" class="dcu-editor-plane" aria-hidden="true"></div><header v-if="model.focused" ref="heading" class="dcu-editor-heading"><div><small>正在编辑</small><h3>{{editing?.title}}</h3></div><span>直接选择动作，无需额外确认</span></header><div ref="native" class="dcu-native"></div><p v-if="model.focused&&model.unknown" class="dcu-extension-note">附加内容保留在原位置，未被聚焦折叠。</p></div>
  </div>
  <footer ref="dock" class="dcu-footer" aria-label="战斗操作栏" @click.capture="nativeMenuClick">
   <div v-if="!model.focused" class="dcu-summary-rail" aria-label="本回合摘要"><button v-for="g in model.groups" :key="g.key" type="button" :title="g.title+'：'+(g.selected||'暂无已选动作')" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key)"><span>{{g.title}}<small v-if="!g.available"> · 暂不可用</small></span><strong>{{g.selected||'暂无已选动作'}}</strong></button></div>
   <aside v-if="summaryOpen" class="dcu-summary" aria-label="本回合选择"><div class="dcu-summary-header"><div class="dcu-summary-heading"><h3>本回合选择</h3><span>{{model.groups.length}} 组</span></div><p class="dcu-hint">点击部位定位，继续后执行。</p></div><div class="dcu-summary-list"><button v-for="g in model.groups" :key="g.key" type="button" :aria-current="currentGroup===g.key?'location':undefined" @click="jump(g.key);summaryOpen=false"><span>{{g.title}}</span><strong>{{g.selected||'暂无已选动作'}}</strong></button></div></aside>
   <button type="button" class="dcu-summary-toggle" :aria-expanded="summaryOpen" @click="toggleSummary">{{summaryOpen?'收起摘要':'选择摘要'}}<span>{{model.groups.length}}</span></button><div class="dcu-dock-native" aria-label="原生战斗操作"></div>
  </footer>
 </section>
</template>
