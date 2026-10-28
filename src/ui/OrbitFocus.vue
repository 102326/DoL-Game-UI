<script setup lang="ts">
import {nextTick,onBeforeUnmount,onMounted,reactive,ref,watch} from 'vue';
import {sourceMotion} from '../ui/source-motion';
import {navigationRect} from './navigation-geometry';
import {visualScope} from './visual-scope';
const props=defineProps<{active:string;layout?:string;selector?:string;container?:HTMLElement}>();

const focus=ref<HTMLElement>();let nav:HTMLElement|undefined;
const bounds=reactive({left:0,top:0,width:0,height:0,radius:11});
const scope=visualScope(),motion=sourceMotion();scope.own(()=>motion.dispose());let resize:ResizeObserver|undefined,paintRoot:HTMLElement|undefined,dialog:HTMLElement|null=null,visibility:MutationObserver|undefined,revision=0;
async function place(moving=false){
 if(!scope.active())return;
 const root=nav,ring=focus.value,button=root?.querySelector<HTMLElement>(props.selector??'[aria-current="page"]');
 if(!root||!ring)return;if(!button){revision++;bounds.width=0;motion.cancel(ring);return}
 if((dialog?.tagName==='DIALOG'&&!dialog.hasAttribute('open'))||!!button.closest('[hidden],.hidden,[inert]')||!!dialog?.hasAttribute('data-sf-leaving')||!button.getClientRects().length){revision++;bounds.width=0;motion.cancel(ring);return}
 // A display:contents navigation has no box; the ring uses its actual positioning ancestor.
 const base=ring.offsetParent instanceof HTMLElement?ring.offsetParent:root;
 if(paintRoot!==base){if(paintRoot&&paintRoot!==root)resize?.unobserve(paintRoot);paintRoot=base;if(base!==root)resize?.observe(base)}
 const target=navigationRect(base,button.getBoundingClientRect());
 if(!target){revision++;motion.cancel(ring);Object.assign(bounds,{left:0,top:0,width:0,height:0});return}
 const next={...target,radius:Math.min(target.width/2,target.height/2,parseFloat(getComputedStyle(button).borderTopLeftRadius)||11)};
 // Repeated observation of the same target must not settle an in-flight selection.
 if(!moving&&(['left','top','width','height','radius'] as const).every(key=>next[key]===bounds[key]))return;
 const ticket=++revision,from=navigationRect(base,ring.getBoundingClientRect());
 Object.assign(bounds,next);
 await nextTick();if(!scope.active()||ticket!==revision||!ring.isConnected)return;
 motion.cancel(ring);
 if(moving&&from)motion.animate(ring,[{transform:`translate(${from.left-bounds.left}px,${from.top-bounds.top}px) scale(${from.width/bounds.width},${from.height/bounds.height})`},{transform:'translate(0,0) scale(1,1)'}],580);
}
function realign(){void place()}
function schedule(){scope.frame(realign)}
watch(()=>props.active,()=>void place(true),{flush:'post'});
watch(()=>props.layout,()=>{revision++;motion.cancel();schedule()},{flush:'post'});
onMounted(()=>{
 nav=props.container??focus.value?.parentElement??undefined;nav?.addEventListener('scroll',schedule,{passive:true});dialog=nav?.closest('dialog,#customOverlay')||null;
 if(typeof ResizeObserver==='function'){resize=new ResizeObserver(schedule);scope.own(()=>resize?.disconnect());if(nav)resize.observe(nav)}
 if(dialog){visibility=new MutationObserver(schedule);scope.own(()=>visibility?.disconnect());visibility.observe(dialog,{attributes:true,attributeFilter:['open','data-sf-leaving','class','hidden','inert']})}
 scope.own(()=>nav?.removeEventListener('scroll',schedule));window.addEventListener('resize',schedule);scope.own(()=>window.removeEventListener('resize',schedule));schedule();
});
onBeforeUnmount(()=>{revision++;scope.dispose()});
</script>
<template>
  <div ref="focus" class="dmt-orbit-focus" aria-hidden="true" :style="{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px',borderRadius:bounds.radius+'px',visibility:bounds.width?'visible':'hidden'}">
   <svg :viewBox="`0 0 ${bounds.width} ${bounds.height}`" preserveAspectRatio="none"><rect class="dmt-orbit-base" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/><rect class="dmt-orbit-flow" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/><rect class="dmt-orbit-tail" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/></svg>
  </div>
</template>
