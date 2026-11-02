<script setup lang="ts">
import {onMounted,onUnmounted,ref} from 'vue';
import GameButton from '../ui/GameButton.vue';
import type {FloatingApi} from './main';
import {floatingDefaults,toolIds,type FloatingPreferences} from './preferences';
const p=ref<FloatingPreferences>({...floatingDefaults,tools:[...toolIds]});
declare const __STONE_FREE_CONSUMER__:boolean;
// Settings can mount before the official wrapper publishes its product version.
const officialHub=typeof __STONE_FREE_CONSUMER__!=='undefined'&&__STONE_FREE_CONSUMER__;
const names={settings:'界面设置',inspector:'开发检查',move:'移动悬浮球'};
const api=()=> (window as Window & {DoLFloatingTools?:FloatingApi}).DoLFloatingTools;
function sync(){const value=api()?.getPreferences();if(value)p.value=value}
function set(key:keyof FloatingPreferences,value:unknown){api()?.setPreference(key,value);sync()}
function tool(id:typeof toolIds[number],checked:boolean){set('tools',checked?[...p.value.tools,id]:p.value.tools.filter(t=>t!==id))}
onMounted(()=>{sync();document.addEventListener('dol-floating-change',sync)});onUnmounted(()=>document.removeEventListener('dol-floating-change',sync));
</script>
<template><section class="dmt-setting-card"><h3>高级快捷工具</h3><label class="dgu-setting-row"><span>启用悬浮球</span><input type="checkbox" aria-label="启用悬浮球" :checked="p.enabled" @change="set('enabled',($event.target as HTMLInputElement).checked)"/></label><label class="dgu-setting-row"><span><strong>默认展开模式</strong><small>扇形沿球体展开，网格以面板排列。</small></span><select aria-label="悬浮球展开模式" :value="p.mode" @change="set('mode',($event.target as HTMLSelectElement).value)"><option value="fan">扇形</option><option value="grid">网格</option></select></label><details class="dsf-settings-more"><summary>工具与位置</summary><p v-if="!officialHub">扇形快捷工具（网格仍展示全部工具）：</p><label v-for="id in toolIds" :key="id" v-show="!officialHub" class="dgu-setting-row"><span>{{names[id]}}</span><input type="checkbox" :aria-label="'扇形工具：'+names[id]" :checked="p.tools.includes(id)" @change="tool(id,($event.target as HTMLInputElement).checked)"/></label><GameButton @click="api()?.show()">找回悬浮球</GameButton><GameButton @click="api()?.resetPosition()">重置悬浮球位置</GameButton></details><p v-if="officialHub">点击展开；拖动或用方向键移动，靠近侧边可停靠。暂时隐藏后可在这里找回。关闭不清除已保存的位置。</p><p v-else>点击展开，长按后拖动；也可通过“移动悬浮球”调位置。暂时隐藏后可在这里找回。</p></section></template>
