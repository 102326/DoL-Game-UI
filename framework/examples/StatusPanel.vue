<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import type {Claim, Host, Json, MountContext, Participant} from '../contracts';
const props = defineProps<{host: Host; owner: Participant; hostContext: MountContext}>();
const values = ref<Record<string, Json>>({}), status = ref('尚未采样'), message = ref('');
const dialog = ref<HTMLDialogElement>(), opener = ref<HTMLButtonElement>();
const labels: Record<string, string> = {pain: '疼痛', stress: '压力', tiredness: '疲劳'};
let modal: Readonly<Claim> | null = null, shortcut: Readonly<Claim> | null = null, request = 0;
let restore: HTMLElement | null = null;
async function refresh() {
 const ticket = ++request, binding = props.hostContext.binding();
 const source = props.host.sources('dol.status.experimental')[0];
 if (!source) {values.value = {}; status.value = '提供者未安装或已退出'; return}
 const result = await source.read(binding);
 if (!props.hostContext.isCurrent() || ticket !== request) return;
 if (!result.ok) {values.value = {}; status.value = `本次读取不可用：${result.reason}`; return}
 if (!result.value || typeof result.value !== 'object' || Array.isArray(result.value)) {values.value = {}; status.value = '来源不符合状态数据约定'; return}
 values.value = result.value;
 status.value = `来源 ${source.owner} · 场景 ${result.generation} · 按需采样`;
}
function close() {
 const hadFocus = dialog.value?.contains(document.activeElement);
 if (dialog.value?.open) dialog.value.close();
 modal?.release(); modal = null;
 if (hadFocus && restore?.isConnected) restore.focus({preventScroll: true});
}
function nativeClose() {if (!dialog.value?.open) close()}
function open() {
 if (dialog.value?.open) return;
 const claim = props.owner.claim('modal', 'foreground');
 if (!claim) {message.value = '另一个参与者正在显示详情，请先关闭。'; return}
 modal = claim; restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
 try {dialog.value!.showModal(); message.value = ''; void refresh()} catch {close(); message.value = '此浏览器不支持详情窗口。'}
}
function keydown(event: KeyboardEvent) {
 // This listener belongs only to this Mod's root. Native/IME inputs are untouched.
 if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.altKey || event.metaKey
  || !(event.target instanceof Element) || event.target.closest('input,textarea,select,[contenteditable]') || event.key !== 'k') return;
 if (!shortcut?.isCurrent()) {message.value = '快捷键已由另一参与者申请；仍可点击打开。'; return}
 event.preventDefault(); open();
}
function requestShortcut() {shortcut?.release(); shortcut = props.owner.claim('shortcut', 'preview-k'); message.value = shortcut ? '已取得预览快捷键（仅本组件内）。' : '预览快捷键正被另一参与者使用。'}
function releaseShortcut() {shortcut?.release(); shortcut = null; message.value = '已释放预览快捷键。'}
const stopSources = props.host.onContributions(() => {void refresh()});
const stopScene = props.hostContext.onScene(() => {close(); void refresh()});
onMounted(() => {requestShortcut(); void refresh()});
onUnmounted(() => {request++; close(); shortcut?.release(); stopSources(); stopScene()});
</script>

<template>
 <section class="sf-example" @keydown="keydown">
  <button ref="opener" type="button" @click="open">状态速览</button>
  <span class="sf-message" role="status">{{message}}</span>
  <dialog ref="dialog" @cancel.prevent="close" @close="nativeClose">
   <header><h2>状态速览</h2><button type="button" @click="close">关闭</button></header>
   <p class="sf-subtle">{{status}}</p>
   <dl>
    <div v-for="(value, key) in values" :key="key"><dt>{{labels[key] ?? key}}</dt><dd>{{value ?? '未知'}}</dd></div>
   </dl>
   <label>本地备注（不保存）<input aria-label="本地备注" placeholder="输入时不触发快捷键"></label>
   <footer><button type="button" @click="refresh">重新读取</button><button type="button" @click="requestShortcut">申请快捷键</button><button type="button" @click="releaseShortcut">释放快捷键</button></footer>
  </dialog>
 </section>
</template>
