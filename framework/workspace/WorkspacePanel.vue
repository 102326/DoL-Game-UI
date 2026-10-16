<script setup lang="ts">
import {ref, shallowRef, computed, onMounted, onUnmounted, nextTick} from 'vue';
import type {Binding, Claim, Host, MountContext, Participant, View} from '../contracts';
import {readLayout, saveLayout} from './preferences';
import ViewOutlet from './ViewOutlet.vue';
const props = defineProps<{host: Host; owner: Participant; hostContext: MountContext; alternate?: boolean}>();
const title = props.alternate ? '替代工作台' : '信息工作台';
const storageKey = `StoneFreeWorkspace.${props.owner.id}.v1`;
let storage: Storage | undefined;
try {storage = window.localStorage} catch {/* Storage is optional; the current layout still works. */}
const preferences = ref(storage ? readLayout(storage, storageKey) : {order: [], hidden: [], density: 'comfortable' as const});
const views = shallowRef<readonly View[]>([]), region = shallowRef<Readonly<Claim> | null>(null);
const dialog = ref<HTMLDialogElement>(), opener = ref<HTMLButtonElement>();
const opened = ref(false), editing = ref(false), message = ref(''), releasing = ref(false);
let shortcut: Readonly<Claim> | null = null, modal: Readonly<Claim> | null = null;
let previousFocus: HTMLElement | null = null, opening: Binding | undefined;
const instanceIds = new Map<string, string>(); let sequence = 0;
const key = (view: View) => `${view.owner}:${view.id}`;
function instance(view: View) {
 const id = key(view); let value = instanceIds.get(id);
 if (!value) {value = `${props.owner.id}.v${++sequence}`; instanceIds.set(id, value)}
 return value;
}
const ordered = computed(() => {
 const rank = new Map(preferences.value.order.map((id, index) => [id, index]));
 return [...views.value].sort((a, b) => (rank.get(key(a)) ?? 1000) - (rank.get(key(b)) ?? 1000));
});
const visible = computed(() => ordered.value.filter(view => !preferences.value.hidden.includes(key(view))));
function persist() {message.value = storage && saveLayout(storage, storageKey, preferences.value) ? '布局已保存。' : '本次布局无法保存；当前显示仍已调整。'}
function move(view: View, direction: number) {
 const order = ordered.value.map(key), index = order.indexOf(key(view)), next = index + direction;
 if (next < 0 || next >= order.length) return;
 [order[index], order[next]] = [order[next], order[index]];
 // Retain preferences for temporarily absent providers.
 preferences.value.order = [...order, ...preferences.value.order.filter(id => !order.includes(id))].slice(0, 100); persist();
}
function setVisible(view: View, event: Event) {
 if (!(event.target instanceof HTMLInputElement)) return;
 preferences.value.hidden = event.target.checked ? preferences.value.hidden.filter(id => id !== key(view)) : [...new Set([...preferences.value.hidden, key(view)])].slice(0, 100); persist();
}
function close() {
 const hadFocus = dialog.value?.contains(document.activeElement);
 opening?.signal.removeEventListener('abort', close); opening = undefined;
 if (dialog.value?.open) dialog.value.close();
 opened.value = false; modal?.release(); modal = null;
 if (hadFocus && previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
}
function nativeClose() {if (!dialog.value?.open) close()}
function acquire() {
 if (releasing.value) return false;
 if (region.value?.isCurrent()) return true;
 region.value = props.owner.claim('region', 'information-workspace');
 if (!region.value) {message.value = '共享区域正在由其他布局使用；可以稍后再申请。'; return false}
 shortcut = props.owner.claim('shortcut', 'workspace-k');
 message.value = shortcut ? '区域与组件内快捷键可用。' : '区域可用；快捷键由另一参与者使用。';
 return true;
}
async function release() {
 if (releasing.value) return;
 releasing.value = true; close(); await nextTick();
 shortcut?.release(); shortcut = null; region.value?.release(); region.value = null;
 releasing.value = false; message.value = '已释放区域和快捷键。';
}
function open() {
 if (dialog.value?.open || !acquire()) return;
 const binding = props.hostContext.binding();
 if (!binding.isCurrent()) {message.value = '场景正在更新，请稍后再打开。'; return}
 modal = props.owner.claim('modal', 'foreground');
 if (!modal) {message.value = '另一个参与者正在显示详情，请先关闭。'; return}
 previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
 try {
  dialog.value!.showModal(); opened.value = true;
  opening = binding; opening.signal.addEventListener('abort', close, {once: true});
 } catch {close(); message.value = '此浏览器暂不支持工作台浮层。'}
}
function keydown(event: KeyboardEvent) {
 if (event.defaultPrevented || event.repeat || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.key !== 'k'
  || !(event.target instanceof Element) || event.target.closest('input,textarea,select,[contenteditable]')
  || event.target.closest('[data-sf-owner]') !== props.hostContext.element || !shortcut?.isCurrent()) return;
 event.preventDefault(); if (opened.value) close(); else open();
}
function rescan() {views.value = props.host.views()}
const stop = props.host.onViews(rescan);
onMounted(() => {rescan(); acquire()});
onUnmounted(() => {close(); stop(); shortcut?.release(); region.value?.release()});
</script>
<template>
 <section class="sf-workspace-entry" :class="{'sf-alternate': alternate}" :data-region-state="region ? 'active' : 'busy'" @keydown="keydown">
  <button ref="opener" type="button" @click="open">{{title}}</button>
  <span class="sf-entry-message" role="status">{{message}}</span>
  <dialog ref="dialog" class="sf-workspace" :aria-label="title" :class="{'sf-workspace-stack': alternate, 'sf-workspace-compact': preferences.density === 'compact'}" @cancel.prevent="close" @close="nativeClose">
   <header><div><small>STONE FREE · 实验工作台</small><h2>{{title}}</h2></div><button type="button" @click="close">关闭</button></header>
   <nav aria-label="工作台工具"><button type="button" :aria-pressed="editing" @click="editing = !editing">{{editing ? '完成编辑' : '编辑布局'}}</button><label>密度<select v-model="preferences.density" @change="persist"><option value="comfortable">舒适</option><option value="compact">紧凑</option></select></label></nav>
   <p class="sf-workspace-note">内容由自愿接入的 Mod 提供，原游戏保持原状。</p>
   <div v-if="editing" class="sf-layout-options">
    <div v-for="(view, index) in ordered" :key="key(view)"><label><input type="checkbox" :checked="!preferences.hidden.includes(key(view))" @change="setVisible(view, $event)">{{view.title}}</label><button type="button" :disabled="index === 0" :aria-label="`${view.title}向上`" @click="move(view, -1)">↑</button><button type="button" :disabled="index === ordered.length - 1" :aria-label="`${view.title}向下`" @click="move(view, 1)">↓</button></div>
   </div>
   <main v-if="opened && region" class="sf-workspace-grid">
    <article v-for="view in visible" :key="key(view)" :data-view="key(view)"><h3>{{view.title}}</h3><ViewOutlet :view="view" :instance="instance(view)" /></article>
    <p v-if="!visible.length">暂无可显示内容。可以编辑布局，或等待提供者接入。</p>
   </main>
   <footer><span role="status">{{message}}</span><details><summary>布局提供者</summary><button type="button" :disabled="releasing" @click="release">释放工作区</button><p>释放后，其它自愿接入的布局可以申请同一区域。</p></details></footer>
  </dialog>
 </section>
</template>
