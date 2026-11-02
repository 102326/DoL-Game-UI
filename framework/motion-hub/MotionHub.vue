<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef} from 'vue';
import {visualScope} from '../../src/ui/visual-scope';
const scope=visualScope();
import type {Binding, Host, MountContext, View} from '../contracts';
import ViewOutlet from '../workspace/ViewOutlet.vue';
import {clamp, initialPosition, locate, menuLayout, positionKey, readPosition} from './geometry';

const props = defineProps<{host: Host; hostContext: MountContext; dismiss: () => void;preferredMode?:'fan'|'grid';officialPreferences?:boolean;directActions?:Record<string,()=>string|void>;experimentalMotion?:(root:HTMLElement)=>()=>void}>();
const layer = ref<HTMLElement>(), ball = ref<HTMLButtonElement>(), heading = ref<HTMLElement>();
let saved = initialPosition();
try {saved = readPosition(localStorage.getItem(positionKey))} catch { /* Storage is optional. */ }
const area = reactive({left: 0, top: 0, width: innerWidth, height: innerHeight});
const point = reactive(locate(saved, area)), docked = ref(saved.docked), expanded = ref(false), dragging = ref(false), repositioning = ref(false);
const selected = shallowRef<View>(), views = shallowRef(props.host.views()), message = ref('');
let gesture: {id: number; x: number; y: number; startX: number; startY: number; viewport: string} | undefined;
let suppressClick = false, sequence = 0, stopHint:(()=>void)|undefined, instance = ref('motion-view-0'), binding: Binding;
let stopExperimental:(()=>void)|undefined,coordinateScale={x:1,y:1};
let geometryObserver:ResizeObserver|undefined,observedDock:HTMLElement|undefined;
const side = computed(() => point.x < area.left + area.width / 2 ? 'left' : 'right');
const menu = computed(() => {
 const count=views.value.length,hasSettings=views.value.some(view=>view.id==='interface-settings');
 const rows=Math.ceil((count-(hasSettings?1:0))/2),officialHeight=24+(hasSettings?58:0)+rows*66+(rows+(hasSettings?1:0))*6+57;
 const fan=props.officialPreferences&&props.preferredMode==='fan';
 return menuLayout(point,area,count,props.preferredMode==='grid'||count>3&&!fan,docked.value?38:56,props.officialPreferences?officialHeight:undefined,fan);
});
const grid = computed(() => menu.value.grid);
function petalOffset(index:number){
 if(!props.officialPreferences||grid.value)return{x:menu.value.petalX,y:index*66};
 const curve=Math.cos((index/Math.max(1,views.value.length-1)-.5)*Math.PI);
 return{x:menu.value.petalX===0?28+64*curve:92-64*curve,y:index*76};
}
function clearHint(){stopHint?.();stopHint=undefined;message.value=''}
function hint(text:string){clearHint();message.value=text;stopHint=scope.timeout(clearHint,2200)}
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
 if(!scope.active())return;
 cancel();
 const viewport = window.visualViewport, css = layer.value && getComputedStyle(layer.value);
 const inset = (name: string) => parseFloat(css?.getPropertyValue(name) || '') || 0;
 const left = inset('--safe-left'), right = inset('--safe-right'), top = inset('--safe-top'), bottom = inset('--safe-bottom');
 const rect=props.experimentalMotion?layer.value?.getBoundingClientRect():undefined;
 const scale={x:rect?rect.width/Math.max(1,layer.value!.offsetWidth):1,y:rect?rect.height/Math.max(1,layer.value!.offsetHeight):1};
 // Hidden roots have no coordinate space. Keep the last valid geometry until visible.
 if(!Number.isFinite(scale.x)||!Number.isFinite(scale.y)||scale.x<=0||scale.y<=0)return;
 coordinateScale=scale;
 const nextArea={left: ((viewport?.offsetLeft || 0)-(rect?.left||0))/coordinateScale.x+left, top: ((viewport?.offsetTop || 0)-(rect?.top||0))/coordinateScale.y+top,
  width: Math.max(80, (viewport?.width || innerWidth)/coordinateScale.x - left - right), height: Math.max(100, (viewport?.height || innerHeight)/coordinateScale.y - top - bottom)};
 // Native combat controls use the top layer; reserve their visible bottom region.
 const dock=props.officialPreferences?document.querySelector<HTMLElement>('.dcu-footer'):null;
 if(observedDock!==dock){if(observedDock)geometryObserver?.unobserve(observedDock);observedDock=dock??undefined;if(observedDock)geometryObserver?.observe(observedDock)}
 const dockRect=dock?.getBoundingClientRect(),viewBottom=(viewport?.offsetTop||0)+(viewport?.height||innerHeight);
 if(dock&&dockRect&&dockRect.height>0&&dockRect.bottom>=viewBottom-2&&getComputedStyle(dock).visibility!=='hidden'){
  const top=(dockRect.top-(rect?.top||0))/coordinateScale.y;
  if(top>nextArea.top+100)nextArea.height=Math.min(nextArea.height,top-nextArea.top-12);
 }
 const changed=Object.keys(nextArea).some(key=>nextArea[key as keyof typeof nextArea]!==area[key as keyof typeof area]);
 if(changed)repositioning.value=true;
 Object.assign(area,nextArea);Object.assign(point, locate(saved, area));
 if(changed)void nextTick(()=>{if(!scope.active())return;ball.value?.getBoundingClientRect();scope.frame(settlePosition)});
}
function settlePosition(){repositioning.value=false}
const viewportStamp = () => {const v = window.visualViewport; return [v?.width || innerWidth, v?.height || innerHeight, v?.offsetLeft || 0, v?.offsetTop || 0,props.experimentalMotion?getComputedStyle(document.body).zoom:''].join(':')};
function schedule() {if(!scope.active())return;cancel();scope.frame(sync)}
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
 const dx = (event.clientX - gesture.x)/coordinateScale.x, dy = (event.clientY - gesture.y)/coordinateScale.y;
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
const stopScene = props.hostContext.onScene(()=>{arm();schedule()});
function dockToggle(event:Event){if(event.target instanceof Element&&event.target.matches('.dcu-footer'))schedule()}
const stopViews = props.host.onViews(() => {views.value = props.host.views(); if (selected.value && !views.value.some(view => view.mount === selected.value?.mount)) close()});
onMounted(() => {sync(); arm();if(props.experimentalMotion&&layer.value)stopExperimental=props.experimentalMotion(layer.value);if(props.experimentalMotion&&layer.value){try{const resize=geometryObserver=new ResizeObserver(schedule);scope.own(()=>resize.disconnect());resize.observe(layer.value);if(observedDock)resize.observe(observedDock)}catch(error){console.warn('[MotionHub] geometry observer unavailable; viewport events remain active',error)}}if(props.officialPreferences)document.addEventListener('dol-floating-reset',reset); window.addEventListener('resize', schedule); window.addEventListener('blur', interrupt); window.addEventListener('pagehide', interrupt);
 document.addEventListener('toggle',dockToggle,true);window.visualViewport?.addEventListener('resize', schedule); window.visualViewport?.addEventListener('scroll', schedule); document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside)});
scope.own(()=>stopExperimental?.());
scope.own(() => {interrupt();document.removeEventListener('dol-floating-reset',reset); binding?.signal.removeEventListener('abort', interrupt); stopScene(); stopViews();
 window.removeEventListener('resize', schedule); window.removeEventListener('blur', interrupt); window.removeEventListener('pagehide', interrupt);
 document.removeEventListener('toggle',dockToggle,true);window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside)});
onBeforeUnmount(scope.dispose);
</script>

<template>
 <div ref="layer" class="sf-motion-hub" :data-official="officialPreferences || undefined" @keydown="key">
  <div class="sf-motion-rail" :class="{'is-magnetic': magnet}" :style="rail" aria-hidden="true"></div>
  <nav class="sf-motion-orbit" aria-label="自由工具" :aria-hidden="!expanded" :inert="!expanded" :class="{'is-expanded': expanded, 'is-grid': grid}"
  :style="{left: `${menu.x}px`, top: `${menu.y}px`, width:`${menu.width}px`,height:`${menu.height}px`,'--utility-x': `${menu.petalX===0?0:menu.width-64}px`,'--origin-x': `${point.x + 28 - menu.x}px`, '--origin-y': `${point.y + 28 - menu.y}px`}">
   <button v-for="(view, index) in views" :key="`${view.owner}:${view.id}`" type="button" class="sf-motion-petal" :data-motion-view="`${view.owner}:${view.id}`"
    :style="{'--i': index, '--x': `${petalOffset(index).x}px`, '--y': `${petalOffset(index).y}px`}" @click="choose(view)">
    <svg v-if="officialPreferences" class="sf-motion-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
     <path v-if="view.id==='interface-settings'" d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>
     <path v-else-if="view.id==='native-saves'" d="M5 3h12l3 3v15H4V3h1Zm3 0v7h8V3M8 21v-7h8v7"/>
     <path v-else-if="view.id==='native-social'" d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6M1 21v-2a7 7 0 0 1 14 0v2m1-8a6 6 0 0 1 7 6v2"/>
     <path v-else-if="view.id==='native-attributes'" d="M4 20V10m5 10V4m6 16v-7m5 7V7M2 20h20"/>
     <path v-else d="m12 2 10 10-10 10L2 12 12 2Zm0 5v6m0 3v1"/>
    </svg><span v-else aria-hidden="true">{{ ['◉', '◈', '⇄'][index % 3] }}</span><span class="sf-motion-tool-label">{{ view.title }}</span>
   </button>
   <div class="sf-motion-utilities">
    <button type="button" @click="dock"><svg v-if="officialPreferences" :style="{transform:side==='left'?'scaleX(-1)':undefined}" class="sf-motion-utility-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 4v16M4 12h11m-4-4 4 4-4 4"/></svg><span>停靠侧边</span></button>
    <button type="button" @click="reset"><svg v-if="officialPreferences" class="sf-motion-utility-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8a8 8 0 1 1-1 7M5 3v5h5"/><circle cx="12" cy="12" r="2"/></svg><span>恢复位置</span></button>
    <button type="button" @click="dismiss"><svg v-if="officialPreferences" class="sf-motion-utility-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.5 5.2c4.8-.7 8.2 3 10.5 6.8a17 17 0 0 1-3.1 3.8M6.1 6.1A20 20 0 0 0 1 12c3 5 7 8 11 7a11 11 0 0 0 3.2-.8"/><path d="M10 10a3 3 0 0 0 4 4"/></svg><span>隐藏工具</span></button>
   </div>
  </nav>
  <section class="sf-motion-sheet" aria-label="自由工具详情" :aria-hidden="!selected" :inert="!selected" :class="{'is-open': !!selected}"
   :style="{left: `${panel.x}px`, top: `${panel.y}px`, width: `${panel.width}px`, height: `${panel.height}px`, '--origin-x': `${point.x + 28 - panel.x}px`, '--origin-y': `${point.y + 28 - panel.y}px`}">
   <header><div><small>SOFT & WET · KRAFT WORK</small><h2 ref="heading" tabindex="-1">{{ selected?.title || '自由工具' }}</h2></div><button type="button" aria-label="关闭详情" @click="close()">×</button></header>
   <main><ViewOutlet v-if="selected" :view="selected" :instance="instance" /></main>
   <footer><button type="button" @click="selected = undefined; expanded = true; ball?.focus({preventScroll: true})">返回工具</button><span>返回后继续游戏</span></footer>
  </section>
  <button ref="ball" type="button" class="sf-motion-ball" :class="{'is-dragging': dragging, 'is-docked': docked, 'is-open': expanded || !!selected}"
   :aria-label="docked ? '恢复悬浮工具' : 'Kraft Work 自由工具'" title="点击展开；拖到边缘停靠；方向键移动，Escape 收起" :aria-expanded="expanded || !!selected" :style="{transform: `translate3d(${point.x}px, ${point.y}px, 0)`, transition: repositioning ? 'none' : undefined}"
   @click="toggle" @pointerdown.stop="down" @pointermove.stop="move" @pointerup.stop="up" @pointercancel.stop="cancel" @lostpointercapture="cancel"
   @touchstart.stop @touchmove.stop @touchend.stop @touchcancel.stop><span aria-hidden="true"><svg v-if="officialPreferences" class="sf-motion-emblem" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 4 27 16 16 28 5 16 16 4Z"/><path d="m10 16 6-6 6 6-6 6-6-6Z"/><path d="M16 1v6m15 9h-6M16 31v-6M1 16h6"/></svg><template v-else>{{ docked ? '⋮' : '✦' }}</template></span></button>
  <p class="sf-motion-feedback" role="status" :style="{left: `${clamp(point.x - 100, area.left + 12, area.left + area.width - 212)}px`, top: `${clamp(point.y + 80, area.top + 12, area.top + area.height - 38)}px`}">{{ dragging ? (magnet ? '松手停靠' : '拖到边缘可停靠') : message }}</p>
 </div>
</template>
