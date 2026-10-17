<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef} from 'vue';
import type {Binding, Host, MountContext, View} from '../contracts';
import ViewOutlet from '../workspace/ViewOutlet.vue';
import {clamp, initialPosition, locate, menuLayout, positionKey, readPosition} from './geometry';

const props = defineProps<{host: Host; hostContext: MountContext; dismiss: () => void;preferredMode?:'fan'|'grid';officialPreferences?:boolean;directActions?:Record<string,()=>string|void>}>();
const layer = ref<HTMLElement>(), ball = ref<HTMLButtonElement>(), heading = ref<HTMLElement>();
let saved = initialPosition();
try {saved = readPosition(localStorage.getItem(positionKey))} catch { /* Storage is optional. */ }
const area = reactive({left: 0, top: 0, width: innerWidth, height: innerHeight});
const point = reactive(locate(saved, area)), docked = ref(saved.docked), expanded = ref(false), dragging = ref(false);
const selected = shallowRef<View>(), views = shallowRef(props.host.views()), message = ref('');
let gesture: {id: number; x: number; y: number; startX: number; startY: number; viewport: string} | undefined;
let suppressClick = false, frame = 0, sequence = 0, hintTimer = 0, instance = ref('motion-view-0'), binding: Binding;
const side = computed(() => point.x < area.left + area.width / 2 ? 'left' : 'right');
const menu = computed(() => menuLayout(point, area, views.value.length, props.preferredMode==='grid'||views.value.length>3, docked.value?38:56));
const grid = computed(() => menu.value.grid);
function clearHint(){clearTimeout(hintTimer);hintTimer=0;message.value=''}
function hint(text:string){clearHint();message.value=text;hintTimer=window.setTimeout(clearHint,2200)}
const panel = computed(() => {
 const width = Math.min(360, area.width - 24), height = Math.min(540, area.height - 24);
 return {width, height, x: clamp(side.value === 'right' ? point.x - width - 16 : point.x + 72, area.left + 12, area.left + area.width - width - 12),
  y: clamp(point.y - height / 2, area.top + 12, area.top + area.height - height - 12)};
});
const magnet = computed(() => dragging.value && (point.x < area.left + 32 || point.x + 56 > area.left + area.width - 32));
const rail = computed(() => ({left: `${side.value === 'left' ? area.left : area.left + area.width - 9}px`, top: `${area.top + 12}px`, height: `${area.height - 24}px`}));
function save() {
 const height = docked.value ? 72 : 56;
 saved = {side: side.value, y: clamp((point.y - area.top - 12) / Math.max(1, area.height - height - 24), 0, 1), docked: docked.value};
 try {localStorage.setItem(positionKey, JSON.stringify(saved))} catch {hint('此环境无法保存位置')}
}
function close(restoreFocus = true) {
 clearHint();
 const ownsFocus = layer.value?.contains(document.activeElement);
 expanded.value = false; selected.value = undefined;
 if (restoreFocus && ownsFocus) ball.value?.focus({preventScroll: true});
}
function cancel() {
 if (!gesture) return;
 const id = gesture.id; gesture = undefined; dragging.value = false; suppressClick = true;
 docked.value = saved.docked; Object.assign(point, locate(saved, area));
 if (ball.value?.hasPointerCapture(id)) ball.value.releasePointerCapture(id);
}
function sync() {
 cancel();
 const viewport = window.visualViewport, css = layer.value && getComputedStyle(layer.value);
 const inset = (name: string) => parseFloat(css?.getPropertyValue(name) || '') || 0;
 const left = inset('--safe-left'), right = inset('--safe-right'), top = inset('--safe-top'), bottom = inset('--safe-bottom');
 Object.assign(area, {left: (viewport?.offsetLeft || 0) + left, top: (viewport?.offsetTop || 0) + top,
  width: Math.max(80, (viewport?.width || innerWidth) - left - right), height: Math.max(100, (viewport?.height || innerHeight) - top - bottom)});
 Object.assign(point, locate(saved, area));
}
const viewportStamp = () => {const v = window.visualViewport; return [v?.width || innerWidth, v?.height || innerHeight, v?.offsetLeft || 0, v?.offsetTop || 0].join(':')};
function schedule() {cancel(); if (!frame) frame = requestAnimationFrame(() => {frame = 0; sync()})}
function toggle(event: MouseEvent) {
 if (suppressClick && event.detail > 0) {suppressClick = false; return}
 suppressClick = false;
 if (!props.hostContext.binding().isCurrent()) return;
 if (docked.value) {clearHint();docked.value = false; save(); Object.assign(point, locate(saved, area)); return}
 clearHint();
 if (selected.value || expanded.value) close(); else expanded.value = true;
}
async function choose(view: View) {
 if (!props.hostContext.binding().isCurrent()) return;
 const direct=props.directActions?.[`${view.owner}:${view.id}`];
 if(direct){close(false);const unavailable=direct();if(unavailable)hint(unavailable);return}
 clearHint();
 expanded.value = false; selected.value = view; instance.value = `motion-view-${++sequence}`;
 await nextTick(); if (props.hostContext.isCurrent() && selected.value === view) heading.value?.focus({preventScroll: true});
}
function down(event: PointerEvent) {
 if (!event.isPrimary || event.button !== 0 || gesture) return;
 suppressClick = false; gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, startX: point.x, startY: point.y, viewport: viewportStamp()};
 ball.value?.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
 if (!gesture || event.pointerId !== gesture.id) return;
 const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
 if (!dragging.value && Math.hypot(dx, dy) < 8) return;
 if (!dragging.value) {close(false); docked.value = false; dragging.value = true}
 point.x = clamp(gesture.startX + dx, area.left, area.left + area.width - 56);
 point.y = clamp(gesture.startY + dy, area.top + 12, area.top + area.height - 68);
}
function up(event: PointerEvent) {
 if (!gesture || gesture.id !== event.pointerId) return;
 // Resize delivery can lag pointerup; never commit coordinates from the old viewport.
 if (gesture.viewport !== viewportStamp()) {cancel(); schedule(); return}
 const moved = dragging.value, dock = magnet.value; gesture = undefined; dragging.value = false;
 if (moved) {suppressClick = true; docked.value = dock; save(); Object.assign(point, locate(saved, area)); hint(dock ? '已停靠，点击恢复' : '已吸附到侧边')}
 if (ball.value?.hasPointerCapture(event.pointerId)) ball.value.releasePointerCapture(event.pointerId);
}
function dock() {close(); docked.value = true; save(); Object.assign(point, locate(saved, area)); hint('已停靠，点击恢复')}
function reset() {cancel(); close(); saved = initialPosition(); docked.value = false; Object.assign(point, locate(saved, area)); save(); hint('已恢复默认位置')}
function key(event: KeyboardEvent) {
 if (event.isComposing || (event.target as HTMLElement).matches('input,textarea,select,[contenteditable="true"]')) return;
 if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); cancel(); close(); return}
 if (event.target !== ball.value || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
 event.preventDefault(); close(false); docked.value = false;
 if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') point.x = event.key === 'ArrowLeft' ? area.left : area.left + area.width - 56;
 else point.y = clamp(point.y + (event.key === 'ArrowUp' ? -24 : 24), area.top + 12, area.top + area.height - 68);
 save(); Object.assign(point, locate(saved, area));
}
function outside(event: Event) {if (!layer.value?.contains(event.target as Node)) interrupt()}
function interrupt() {cancel(); close(false)}
function arm() {binding?.signal.removeEventListener('abort', interrupt); binding = props.hostContext.binding(); binding.signal.addEventListener('abort', interrupt, {once: true})}
const stopScene = props.hostContext.onScene(arm);
const stopViews = props.host.onViews(() => {views.value = props.host.views(); if (selected.value && !views.value.some(view => view.mount === selected.value?.mount)) close()});
onMounted(() => {sync(); arm();if(props.officialPreferences)document.addEventListener('dol-floating-reset',reset); window.addEventListener('resize', schedule); window.addEventListener('blur', interrupt); window.addEventListener('pagehide', interrupt);
 window.visualViewport?.addEventListener('resize', schedule); window.visualViewport?.addEventListener('scroll', schedule); document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside)});
onBeforeUnmount(() => {interrupt();document.removeEventListener('dol-floating-reset',reset); cancelAnimationFrame(frame); binding?.signal.removeEventListener('abort', interrupt); stopScene(); stopViews();
 window.removeEventListener('resize', schedule); window.removeEventListener('blur', interrupt); window.removeEventListener('pagehide', interrupt);
 window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside)});
</script>

<template>
 <div ref="layer" class="sf-motion-hub" @keydown="key">
  <div class="sf-motion-rail" :class="{'is-magnetic': magnet}" :style="rail" aria-hidden="true"></div>
  <nav class="sf-motion-orbit" aria-label="自由工具" :aria-hidden="!expanded" :inert="!expanded" :class="{'is-expanded': expanded, 'is-grid': grid}"
  :style="{left: `${menu.x}px`, top: `${menu.y}px`, width:`${menu.width}px`,height:`${menu.height}px`,'--origin-x': `${point.x + 28 - menu.x}px`, '--origin-y': `${point.y + 28 - menu.y}px`}">
   <button v-for="(view, index) in views" :key="`${view.owner}:${view.id}`" type="button" class="sf-motion-petal" :data-motion-view="`${view.owner}:${view.id}`"
    :style="{'--i': index, '--x': `${menu.petalX}px`, '--y': `${index * 66}px`}" @click="choose(view)">
    <span aria-hidden="true">{{ ['◉', '◈', '⇄'][index % 3] }}</span>{{ view.title }}
   </button>
   <div class="sf-motion-utilities"><button type="button" @click="dock">停靠侧边</button><button type="button" @click="reset">恢复位置</button><button type="button" @click="dismiss">隐藏工具</button></div>
  </nav>
  <section class="sf-motion-sheet" aria-label="自由工具详情" :aria-hidden="!selected" :inert="!selected" :class="{'is-open': !!selected}"
   :style="{left: `${panel.x}px`, top: `${panel.y}px`, width: `${panel.width}px`, height: `${panel.height}px`, '--origin-x': `${point.x + 28 - panel.x}px`, '--origin-y': `${point.y + 28 - panel.y}px`}">
   <header><div><small>STONE FREE · 快捷工具</small><h2 ref="heading" tabindex="-1">{{ selected?.title || '自由工具' }}</h2></div><button type="button" aria-label="关闭详情" @click="close()">×</button></header>
   <main><ViewOutlet v-if="selected" :view="selected" :instance="instance" /></main>
   <footer><button type="button" @click="selected = undefined; expanded = true; ball?.focus({preventScroll: true})">返回工具</button><span>返回后继续游戏</span></footer>
  </section>
  <button ref="ball" type="button" class="sf-motion-ball" :class="{'is-dragging': dragging, 'is-docked': docked, 'is-open': expanded || !!selected}"
   :aria-label="docked ? '恢复悬浮工具' : 'Stone Free 自由工具'" title="点击展开；拖到边缘停靠；方向键移动，Escape 收起" :aria-expanded="expanded || !!selected" :style="{transform: `translate3d(${point.x}px, ${point.y}px, 0)`}"
   @click="toggle" @pointerdown.stop="down" @pointermove.stop="move" @pointerup.stop="up" @pointercancel.stop="cancel" @lostpointercapture="cancel"
   @touchstart.stop @touchmove.stop @touchend.stop @touchcancel.stop><span aria-hidden="true">{{ docked ? '⋮' : '✦' }}</span></button>
  <p class="sf-motion-feedback" role="status" :style="{left: `${clamp(point.x - 100, area.left + 12, area.left + area.width - 212)}px`, top: `${clamp(point.y + 80, area.top + 12, area.top + area.height - 38)}px`}">{{ dragging ? (magnet ? '松手停靠' : '拖到边缘可停靠') : message }}</p>
 </div>
</template>
