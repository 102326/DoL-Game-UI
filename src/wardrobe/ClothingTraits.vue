<script setup lang="ts">
import type {NativeWidgetHost} from './host';
import {onMounted,onBeforeUnmount,ref,watch} from 'vue';
const props=defineProps<{traits:string[]}>();
const host=ref<HTMLElement>();let visible=false,observer:IntersectionObserver|undefined;
function render(){
 if(!visible||!host.value)return;host.value.replaceChildren();
 const root=window as NativeWidgetHost,W=root.SugarCube?.Wikifier??root.Wikifier;
 if(!W){host.value.textContent=(props.traits??[]).join(' · ');return}
 for(const trait of props.traits??[]){
  const item=document.createElement('span');
  // Trait names are data; never interpolate macro delimiters from a mod.
  if(/^[\w -]+$/.test(trait))new W(item,`<<clothingtrait ${JSON.stringify(trait)}>>`);
  if(!item.textContent?.trim()&&!item.querySelector('img')||item.querySelector('.error'))item.textContent=trait;
  host.value.append(item);
 }
}
onMounted(()=>{if(!host.value)return;if(typeof IntersectionObserver==='undefined'){visible=true;render();return}observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){visible=true;observer?.disconnect();render()}},{rootMargin:'80px'});observer.observe(host.value)});
watch(()=>props.traits,render,{deep:true});onBeforeUnmount(()=>observer?.disconnect());
</script>
<template><span ref="host" class="dgw-traits" aria-label="衣物特质"></span></template>
<style scoped>.dgw-traits{display:flex;flex-wrap:wrap;gap:5px;font-size:12px}.dgw-traits:empty{display:none}</style>
