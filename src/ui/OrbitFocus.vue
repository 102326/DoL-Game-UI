<script setup lang="ts">
import {nextTick,onBeforeUnmount,onMounted,reactive,ref,watch} from 'vue';
import {sourceMotion} from '../ui/source-motion';
const props=defineProps<{active:string;layout?:string;selector?:string;container?:HTMLElement}>();

const focus=ref<HTMLElement>();let nav:HTMLElement|undefined;
const bounds=reactive({left:0,top:0,width:0,height:0,radius:11});
const motion=sourceMotion();let resize:ResizeObserver|undefined,dialog:HTMLElement|null=null,visibility:MutationObserver|undefined,frame=0,revision=0;
async function place(moving=false){
 const root=nav,ring=focus.value,button=root?.querySelector<HTMLElement>(props.selector??'[aria-current="page"]');
 if(!root||!ring)return;if(!button){bounds.width=0;motion.cancel(ring);return}
 if((dialog?.tagName==='DIALOG'&&!dialog.hasAttribute('open'))||!!root.closest('[hidden],.hidden,[inert]')||!!dialog?.hasAttribute('data-sf-leaving')||!button.getClientRects().length)return;
 const ticket=++revision,r=ring.getBoundingClientRect(),n=root.getBoundingClientRect();
 const sx=root.offsetWidth/n.width,sy=root.offsetHeight/n.height;
 const from={left:(r.left-n.left)*sx+root.scrollLeft,top:(r.top-n.top)*sy+root.scrollTop,width:r.width*sx,height:r.height*sy};
 const target=button.getBoundingClientRect();
 Object.assign(bounds,{left:(target.left-n.left)*sx+root.scrollLeft-root.clientLeft,top:(target.top-n.top)*sy+root.scrollTop-root.clientTop,width:target.width*sx,height:target.height*sy,radius:Math.min(target.width*sx/2,target.height*sy/2,parseFloat(getComputedStyle(button).borderTopLeftRadius)||11)});
 await nextTick();if(ticket!==revision||!ring.isConnected)return;
 motion.cancel(ring);
 if(moving&&from.width>0&&from.height>0)motion.animate(ring,[{transform:`translate(${from.left-bounds.left}px,${from.top-bounds.top}px) scale(${from.width/bounds.width},${from.height/bounds.height})`},{transform:'translate(0,0) scale(1,1)'}],580);
}
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;void place()})}
watch(()=>props.active,()=>void place(true),{flush:'post'});
watch(()=>props.layout,()=>{revision++;motion.cancel();schedule()},{flush:'post'});
onMounted(()=>{
 nav=props.container??focus.value?.parentElement??undefined;nav?.addEventListener('scroll',schedule,{passive:true});dialog=nav?.closest('dialog,#customOverlay')||null;
 if(typeof ResizeObserver==='function'){resize=new ResizeObserver(schedule);if(nav)resize.observe(nav)}
 if(dialog){visibility=new MutationObserver(()=>{revision++;motion.cancel();schedule()});visibility.observe(dialog,{attributes:true,attributeFilter:['open','data-sf-leaving','class','hidden']})}
 window.addEventListener('resize',schedule);schedule();
});
onBeforeUnmount(()=>{nav?.removeEventListener('scroll',schedule);revision++;cancelAnimationFrame(frame);resize?.disconnect();visibility?.disconnect();window.removeEventListener('resize',schedule);motion.dispose()});
</script>
<template>
  <div ref="focus" class="dmt-orbit-focus" aria-hidden="true" :style="{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px',borderRadius:bounds.radius+'px',visibility:bounds.width?'visible':'hidden'}">
   <svg :viewBox="`0 0 ${bounds.width} ${bounds.height}`" preserveAspectRatio="none"><rect class="dmt-orbit-base" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/><rect class="dmt-orbit-flow" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/><rect class="dmt-orbit-tail" x="1" y="1" :width="Math.max(0,bounds.width-2)" :height="Math.max(0,bounds.height-2)" :rx="bounds.radius" pathLength="100"/></svg>
  </div>
</template>
