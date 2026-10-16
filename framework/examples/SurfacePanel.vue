<script setup lang="ts">
import {shallowRef, ref, onUnmounted} from 'vue';
import type {Binding, Claim, Host, MountContext, Participant, View} from '../contracts';
import type {SurfaceHandle, UiApi} from '../../src/public/ui';
import ViewOutlet from '../workspace/ViewOutlet.vue';
const props = defineProps<{host: Host; owner: Participant; hostContext: MountContext}>();
const content = shallowRef<HTMLElement>(), views = shallowRef<readonly View[]>([]), message = ref('');
let surface: Readonly<SurfaceHandle> | null = null, claim: Readonly<Claim> | null = null, binding: Binding | undefined;
let stop: (() => void) | undefined, sequence = 0;
const instances = new Map<View['mount'], string>();
function instance(view: View) {
 let id = instances.get(view.mount);
 if (!id) {id = `official-view-${++sequence}`; instances.set(view.mount, id)}
 return id;
}
function close() {
 binding?.signal.removeEventListener('abort', close); binding = undefined;
 stop?.(); stop = undefined;
 const handle = surface; surface = null;
 content.value = undefined; views.value = []; instances.clear();
 claim?.release(); claim = null; handle?.close();
}
function open() {
 if (content.value) return;
 const ui = (window as Window & {DoLGameUI?: {ui?: UiApi}}).DoLGameUI?.ui;
 if (ui?.apiVersion !== 1 || typeof ui.openDrawer !== 'function' || !ui.getCapabilities?.().surfaces) {message.value = '官方 Surface 未启用；独立视图仍可使用。'; return}
 if (!props.host.getCapabilities?.().views) {message.value = '当前 Host 不支持公开视图；独立入口仍可使用。'; return}
 binding = props.hostContext.binding();
 if (!binding.isCurrent()) {message.value = '场景正在更新，请稍后再打开。'; binding = undefined; return}
 claim = props.owner.claim('modal', 'foreground');
 if (!claim) {message.value = '另一个参与者正在显示详情。'; binding = undefined; return}
 binding.signal.addEventListener('abort', close, {once: true});
 try {
  content.value = document.createElement('div');
  const rescan = () => {views.value = props.host.views()};
  rescan(); stop = props.host.onViews(rescan);
  surface = ui.openDrawer({id: 'StoneFreePublicViews', title: '公开贡献视图', content: content.value, onClose: close});
  if (!surface) {close(); message.value = '当前 Surface 不可用。'}
  else message.value = '';
 } catch {close(); message.value = '当前 Surface 不可用。'}
}
onUnmounted(close);
</script>
<template>
 <section class="sf-example sf-official"><button type="button" @click="open">Soft &amp; Wet 工作台</button><span class="sf-message" role="status">{{message}}</span></section>
 <Teleport v-if="content" :to="content">
  <div class="sf-official-views">
   <article v-for="view in views" :key="instance(view)" :data-view="`${view.owner}:${view.id}`"><h3>{{view.title}}</h3><ViewOutlet :view="view" :instance="instance(view)" /></article>
   <p v-if="!views.length" role="status">暂无公开视图，独立入口仍可使用。</p>
  </div>
 </Teleport>
</template>
<style scoped>
.sf-example.sf-official {left:1rem;right:auto}
.sf-official-views {min-width:0;color:inherit}.sf-official-views article {min-width:0;margin:0 0 24px}.sf-official-views article:last-child {margin-bottom:0}.sf-official-views h3 {font-size:1.05em;margin:0 0 12px}
.sf-official-views :deep(dl) {margin:0}.sf-official-views :deep(dl>div) {display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 0}.sf-official-views :deep(dd) {margin:0}
.sf-official-views :deep(table) {width:100%;border-collapse:collapse;font-size:.9em}.sf-official-views :deep(th),.sf-official-views :deep(td) {padding:6px 3px;border:0;border-bottom:1px solid #ffffff0c;text-align:left}
.sf-official-views :deep(.sf-inline-actions) {display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.sf-official-views :deep(button) {font:inherit;color:inherit;background:#ffffff09;border:1px solid #ffffff18;border-radius:8px;min-height:38px;padding:6px 10px}.sf-official-views :deep(.sf-inline-note) {font-size:.85em;color:var(--dgu-secondary,#aab6c3);overflow-wrap:anywhere}
</style>
