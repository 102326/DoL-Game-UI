<script setup lang="ts">
// Another author's view: compares samples using only the published schema.
import {ref, onMounted, onUnmounted} from 'vue';
import type {Claim, Host, Json, MountContext, Participant} from '../contracts';
const props = defineProps<{host: Host; owner: Participant; hostContext: MountContext}>();
const current = ref<Record<string, Json>>({}), baseline = ref<Record<string, Json>>({});
const status = ref('尚未采样'), dialog = ref<HTMLDialogElement>();
const labels: Record<string, string> = {pain: '疼痛', stress: '压力', tiredness: '疲劳'};
let claim: Readonly<Claim> | null = null, restore: HTMLElement | null = null, ticket = 0;
async function refresh() {
 const turn = ++ticket, binding = props.hostContext.binding();
 const source = props.host.sources('dol.status.experimental')[0];
 if (!source) {current.value = {}; status.value = '状态提供者当前不可用'; return}
 const result = await source.read(binding);
 if (!props.hostContext.isCurrent() || turn !== ticket) return;
 if (!result.ok) {current.value = {}; status.value = `读取不可用：${result.reason}`; return}
 if (!result.value || typeof result.value !== 'object' || Array.isArray(result.value)) {current.value = {}; status.value = '来源不符合状态数据约定'; return}
 current.value = result.value; status.value = `来源 ${source.owner} · 场景 ${result.generation} · 两次采样比较`;
}
function difference(value: Json, key: string) {
 const old = baseline.value[key];
 return typeof old === 'number' && typeof value === 'number' ? value - old : '—';
}
function close() {
 const hadFocus = dialog.value?.contains(document.activeElement);
 if (dialog.value?.open) dialog.value.close();
 claim?.release(); claim = null;
 if (hadFocus && restore?.isConnected) restore.focus({preventScroll: true});
}
function nativeClose() {if (!dialog.value?.open) close()}
function open() {
 if (dialog.value?.open) return;
 claim = props.owner.claim('modal', 'foreground');
 if (!claim) {status.value = '另一参与者正在显示详情'; return}
 restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
 try {dialog.value!.showModal(); void refresh()} catch {close(); status.value = '详情窗口不可用'}
}
const stopSources = props.host.onContributions(() => {void refresh()});
const stopScene = props.hostContext.onScene(() => {close(); baseline.value = {}; void refresh()});
onMounted(() => {void refresh()});
onUnmounted(() => {ticket++; close(); stopSources(); stopScene()});
</script>
<template>
 <section class="sf-example sf-compare">
  <button type="button" @click="open">状态对照</button>
  <dialog ref="dialog" @cancel.prevent="close" @close="nativeClose">
   <header><h2>状态对照</h2><button type="button" @click="close">关闭</button></header>
   <p class="sf-subtle">{{status}}</p>
   <p class="sf-subtle">对照只保存在当前界面；切换场景后清除，不修改游戏。</p>
   <table><thead><tr><th>项目</th><th>当前</th><th>对照</th><th>变化</th></tr></thead>
    <tbody><tr v-for="(value, key) in current" :key="key"><th>{{labels[key] ?? key}}</th><td>{{value ?? '未知'}}</td><td>{{baseline[key] ?? '—'}}</td><td>{{difference(value, key)}}</td></tr></tbody></table>
   <footer><button type="button" @click="baseline = current">设为对照</button><button type="button" @click="refresh">重新读取</button></footer>
  </dialog>
 </section>
</template>
