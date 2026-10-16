<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef} from 'vue';
import type {Binding, Host, MountContext, Participant} from '../contracts';
import {readWardrobe, type ReferenceItem, type WardrobeCatalog} from './source';

const props = defineProps<{host: Host; owner: Participant; hostContext: MountContext}>();
const catalog = shallowRef<WardrobeCatalog | null>(null), opened = ref(false), category = ref(''), query = ref(''), pinned = shallowRef<ReferenceItem | null>(null), selected = shallowRef<ReferenceItem | null>(null), comparing = ref(false), spatial = ref(false), message = ref('');
const launcher = ref<HTMLButtonElement>(), panel = ref<HTMLElement>(), list = ref<HTMLElement>(), currentBinding = shallowRef<Binding>();
let observer: MutationObserver | undefined, sceneStop: (() => void) | undefined, bindingAbort: (() => void) | undefined, sceneInvalidated = false, frame = 0, epoch = 0, listScroll = 0, returnButton: HTMLButtonElement | undefined, comparisonOrigin: DOMRect | undefined;
const items = computed(() => catalog.value?.categories.find(x => x.key === category.value)?.items.filter(x => `${x.name} ${x.colour} ${x.detail}`.toLowerCase().includes(query.value.trim().toLowerCase())) ?? []);
const comparisonItems = computed(() => [{item:pinned.value,label:'A · 固定快照'},{item:selected.value,label:'B · 当前选择'}]);
const panelStyle = ref<Record<string, string>>({});
const sourceText = computed(() => pinned.value ? 'A：固定的衣柜目录快照；仅作信息比较，不包含穿戴操作。' : '先固定 A，再选择 B 进行比较。');

function syncCatalog(reset = false) {
 if (sceneInvalidated) {catalog.value = null; return}
 const next = readWardrobe(window);
 if (next?.passageId !== catalog.value?.passageId) {catalog.value = next; reset = true}
 else if (next) catalog.value = next;
 else catalog.value = null;
 if (reset) {category.value = catalog.value?.categories[0]?.key ?? '';query.value = '';pinned.value = null;selected.value = null;compareBack(false)}
}
function refresh() {
 sceneInvalidated=false;epoch++;
 bindingAbort?.();
 currentBinding.value = props.hostContext.binding();
 const binding=currentBinding.value, abort=()=>invalidate();
 binding.signal.addEventListener('abort',abort,{once:true});bindingAbort=()=>binding.signal.removeEventListener('abort',abort);
 syncCatalog(true);
}
function valid() {
 const binding = currentBinding.value;
 if (!binding?.isCurrent()) {invalidate(); return false}
 syncCatalog();
 if (!catalog.value) {message.value = '当前不是可识别的原版衣柜页面。请使用原版衣柜入口。'; return false}
 return true;
}
function invalidate() {
 epoch++;cancelAnimationFrame(frame);frame=0;sceneInvalidated=true;opened.value = false; comparing.value = false; spatial.value = false; pinned.value = null; selected.value = null; catalog.value = null; currentBinding.value = undefined; returnButton = undefined; comparisonOrigin=undefined;panelStyle.value={};message.value = '场景已更新；请在衣柜页面重新打开参考空间。';
 if (panel.value?.contains(document.activeElement)) launcher.value?.focus({preventScroll: true});
}
function currentItem(key: string) {return catalog.value?.categories.flatMap(category => category.items).find(item => item.key === key)}
function sameItem(a: ReferenceItem, b: ReferenceItem | undefined) {return !!b&&a.key===b.key&&a.name===b.name&&a.colour===b.colour&&a.slot===b.slot}
function pin(item: ReferenceItem) {if (!valid()) return;const fresh=currentItem(item.key);if(sameItem(item,fresh))pinned.value=Object.freeze({...fresh!});else message.value='衣柜目录已更新，请重新选择。'}
function chooseB(item: ReferenceItem, event: MouseEvent) {if (!valid()) return;const fresh=currentItem(item.key);if(!sameItem(item,fresh)){message.value='衣柜目录已更新，请重新选择。';return}selected.value=Object.freeze({...fresh!});returnButton=event.currentTarget as HTMLButtonElement}
function startComparison(useSpatial: boolean) {
 if (comparing.value || !valid() || !pinned.value || !selected.value || pinned.value.key === selected.value.key) {message.value = '请固定一个 A，并选择不同的 B。'; return}
 const freshB=currentItem(selected.value.key);if(!sameItem(selected.value,freshB)){selected.value=null;message.value='B 已不在当前目录，请重新选择。';return}selected.value=Object.freeze({...freshB!});
 const version=++epoch;cancelAnimationFrame(frame);
 const rect = useSpatial ? returnButton?.closest('.sf-wardrobe-reference-item')?.getBoundingClientRect() : undefined;comparisonOrigin=rect;
 listScroll = list.value?.scrollTop ?? 0; comparing.value = true; spatial.value = useSpatial;
 panelStyle.value = useSpatial && rect ? {left: `${rect.left}px`, top: `${rect.top}px`, width: `${Math.max(140, rect.width)}px`, height: `${Math.max(48, rect.height)}px`} : {};
 if (useSpatial && rect) void nextTick(()=>{if(version===epoch&&valid())frame=requestAnimationFrame(()=>{if(version===epoch)panelStyle.value={}})});
}
function compareBack(restore = true) {
 epoch++;cancelAnimationFrame(frame);frame=0;
 if (!valid()) return;
 comparing.value=false;spatial.value=false;panelStyle.value={};comparisonOrigin=undefined;
 const version=epoch;
 void nextTick(()=>{if(version!==epoch||!valid())return;if(list.value)list.value.scrollTop=listScroll;if(restore&&returnButton?.isConnected)returnButton.focus({preventScroll:true})});
}
function close() {epoch++;cancelAnimationFrame(frame);frame=0;if (!valid()) {opened.value=false;return} comparing.value=false;spatial.value=false;opened.value=false;pinned.value=null;selected.value=null;returnButton=undefined;comparisonOrigin=undefined;panelStyle.value={};syncCatalog();const version=epoch;void nextTick(()=>{if(version===epoch)launcher.value?.focus({preventScroll:true})})}
function onKey(event: KeyboardEvent) {if(event.key==='Escape'&&!event.isComposing&&opened.value){event.preventDefault();if(comparing.value)compareBack();else close()}}
function open() {if(!valid())return;const version=++epoch;opened.value=true;message.value='';void nextTick(()=>{if(version===epoch)panel.value?.querySelector<HTMLElement>('[data-reference-close]')?.focus({preventScroll:true})})}
function clearA() {pinned.value=null}
onMounted(()=>{
 refresh();
 const passages=document.querySelector('#passages');
 if(passages){observer=new MutationObserver(()=>syncCatalog());observer.observe(passages,{childList:true,subtree:true})}
 sceneStop=props.hostContext.onScene(()=>{if(!props.hostContext.isCurrent())return;refresh()});
});
onUnmounted(()=>{epoch++;cancelAnimationFrame(frame);observer?.disconnect();sceneStop?.();bindingAbort?.();pinned.value=null;selected.value=null;catalog.value=null;returnButton=undefined;comparisonOrigin=undefined});
</script>

<template>
 <button v-if="catalog" ref="launcher" class="sf-wardrobe-reference-launch" type="button" @click="open">衣柜参考空间</button>
 <p v-if="catalog && (!catalog.categories.length || catalog.unknownSlots.length)" class="sf-wardrobe-reference-note">{{ catalog.unavailable === 'unsupported' ? '当前衣柜结构不受支持。请使用原版衣柜入口。' : catalog.unknownSlots.length ? '部分衣柜部位无法识别；请使用原版衣柜入口处理。' : '当前没有可读取的衣柜清单。请使用原版衣柜入口。' }}</p>
 <section v-if="opened && catalog" class="sf-wardrobe-reference-panel" :class="{'is-comparing': comparing, 'is-spatial': spatial}" :style="panelStyle" ref="panel" @keydown="onKey" role="dialog" aria-modal="false" aria-labelledby="sf-wardrobe-reference-title" tabindex="-1">
  <header><div><small>READ ONLY · WARDROBE REFERENCE</small><h2 id="sf-wardrobe-reference-title">衣柜参考空间</h2></div><button data-reference-close type="button" aria-label="关闭衣柜参考空间" @click="close">×</button></header>
  <div v-show="!comparing" class="sf-wardrobe-reference-browse">
   <p class="sf-wardrobe-reference-source">{{ sourceText }}</p>
   <div v-if="pinned" class="sf-wardrobe-reference-a"><b>固定 A</b><span>{{ pinned.name }} · {{ pinned.colour || '颜色未标注' }}</span><button type="button" @click="clearA">清除 A</button></div>
   <div class="sf-wardrobe-reference-tools"><label>部位<select v-model="category" aria-label="衣物部位"><option v-for="slot in catalog.categories" :key="slot.key" :value="slot.key">{{ slot.label }} ({{ slot.items.length }})</option></select></label><label>搜索<input v-model="query" type="search" maxlength="80" placeholder="名称、颜色或说明"></label></div>
   <div ref="list" class="sf-wardrobe-reference-list" aria-label="只读衣物目录">
    <article v-for="item in items" :key="item.key" class="sf-wardrobe-reference-item" :data-reference-item="item.key">
     <div><b>{{ item.name }}</b><small>{{ item.slot }} · {{ item.colour || '颜色未标注' }}</small><small>保暖 {{ item.warmth ?? '—' }} · 耐久 {{ item.durability ?? '—' }} · 暴露 {{ item.lewd ?? '—' }} · {{ item.outfit }}</small><p v-if="item.detail">{{ item.detail }}</p></div>
     <div class="sf-wardrobe-reference-item-actions"><button type="button" @click="pin(item)">固定 A</button><button data-select-b type="button" @click="chooseB(item,$event)">{{ selected?.key === item.key ? '已选 B' : '选为 B' }}</button></div>
    </article>
    <p v-if="!items.length" class="sf-wardrobe-reference-empty">此部位没有可显示的衣物。</p>
   </div>
   <footer><span>{{ message || (catalog.unknownSlots.length ? '部分部位名称无法识别；原版衣柜仍可处理。' : '目录只读；原版衣柜仍负责穿戴与整理。') }}</span><div><button type="button" :disabled="!pinned || !selected" @click="startComparison(false)">普通比较</button><button type="button" :disabled="!pinned || !selected" @click="startComparison(true)">空间比较</button></div></footer>
  </div>
  <div v-if="comparing" class="sf-wardrobe-reference-comparison-screen">
   <p class="sf-wardrobe-reference-source">A 为固定快照，B 来自当前衣柜目录。两种比较展示同一组只读信息。</p>
   <main class="sf-wardrobe-reference-comparison" aria-label="衣物比较结果">
    <article v-for="entry in comparisonItems" :key="entry.label"><small>{{ entry.label }}</small><h3>{{ entry.item?.name }}</h3><p>{{ entry.item?.slot }} · {{ entry.item?.colour || '颜色未标注' }}</p><dl><div><dt>保暖</dt><dd>{{ entry.item?.warmth ?? '—' }}</dd></div><div><dt>耐久</dt><dd>{{ entry.item?.durability ?? '—' }}</dd></div><div><dt>暴露</dt><dd>{{ entry.item?.lewd ?? '—' }}</dd></div><div><dt>类型</dt><dd>{{ entry.item?.outfit }}</dd></div></dl><p>{{ entry.item?.detail || '没有补充说明。' }}</p></article>
   </main>
   <footer><span>仅比较目录快照；没有穿戴或试穿操作。</span><button type="button" @click="compareBack()">返回目录</button></footer>
  </div>
 </section>
</template>
