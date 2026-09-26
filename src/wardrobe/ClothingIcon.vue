<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type {ClothingIconLayer} from './icons';
const props=defineProps<{layers:ClothingIconLayer[];resolve:(src:string)=>Promise<string|undefined>}>();
const visible=ref(false),ready=ref(false),loaded=ref<(string|undefined)[]>([]),failed=ref(false),root=ref<HTMLElement>(),generation=ref(0);let observer:IntersectionObserver|undefined;
async function load(){const token=++generation.value;ready.value=false;failed.value=false;loaded.value=[];if(!visible.value||!props.layers.length){ready.value=visible.value;return}const result:(string|undefined)[]=[];for(const layer of props.layers){try{const src=await props.resolve(layer.src);if(token!==generation.value)return;result.push(src);if(!src)failed.value=true;}catch{result.push(undefined);if(token===generation.value)failed.value=true;}}if(token===generation.value){loaded.value=result;ready.value=true;}}
function onImageError(event:Event){const element=event.currentTarget as HTMLElement;if(Number(element.dataset.generation)===generation.value)failed.value=true;}
function observe(){if(!root.value)return;if(typeof IntersectionObserver==='undefined'){visible.value=true;load();return}observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){visible.value=true;observer?.disconnect();observer=undefined;load();}},{rootMargin:'80px'});observer.observe(root.value)}
onMounted(observe);watch(()=>props.layers,load,{deep:true});onBeforeUnmount(()=>{generation.value++;observer?.disconnect();observer=undefined});
</script>
<template><span ref="root" class="dgw-clothing-icon" aria-hidden="true"><template v-if="visible&&ready&&!failed&&layers.length"><template v-for="(layer,index) in layers" :key="generation+layer.src+index"><img v-if="loaded[index]" :data-generation="generation" :src="loaded[index]" :class="layer.className" :style="layer.style" alt="" @error="onImageError"></template></template><span v-else class="dgw-clothing-placeholder">衣物</span></span></template>
<style scoped>
.dgw-clothing-icon{display:inline-flex;position:relative;width:40px;height:40px;align-items:center;justify-content:center;flex:0 0 40px;overflow:hidden}.dgw-clothing-icon img{position:absolute;inset:2px;width:36px;height:36px;object-fit:contain}.dgw-clothing-placeholder{font-size:11px;color:#92929f;border:1px solid #363640;border-radius:8px;padding:4px}
</style>
