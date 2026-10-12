<script setup lang="ts">
import {reactive,ref,onMounted,onBeforeUnmount} from 'vue';
import Toolbar from '../src/shop/Toolbar.vue';
const scenario=ref('ordinary'),width=ref(960),index=ref<any>(null),events=ref<{name:string;value:unknown}[]>([]);
const state=reactive({hasDetails:true,isEntry:false,open:false,narrow:false,compact:false,categoriesOpen:false,selectedTitle:'虚构样品',defaultGender:'game',message:''});
const record=(name:string,value:unknown)=>{events.value=[...events.value.slice(-15),{name,value}]};
function setDefaultGender(value:string){state.defaultGender=value;state.message='Lab 内存分类：'+value;record('setDefaultGender',value)}
function toggleCategories(){state.categoriesOpen=!state.categoriesOpen;record('toggleCategories',state.categoriesOpen)}
function toggle(){state.open=!state.open;record('toggle',state.open)}
function changeScene(){Object.assign(state,{open:false,categoriesOpen:false,message:'',narrow:scenario.value!=='ordinary',compact:scenario.value==='compact',selectedTitle:scenario.value==='long'?'用于预览的较长标题：同源组件与局部状态测试，不执行游戏购买或偏好写入':'虚构样品'});width.value=scenario.value==='ordinary'?960:scenario.value==='compact'?360:550;if(scenario.value==='long')state.message='这是一段较长的 Lab 状态消息，仅检查当前组件的文本换行与控件可达性。'}
async function refreshIndex(){try{const next=await(await fetch('/__lab/source-index',{cache:'no-store'})).json();index.value=next.format==='dol-ui-source-index'?next:null}catch{index.value=null}}
function clue(){return {format:'dol-ui-source-clue',version:1,componentId:'shop.toolbar',instanceId:'lab-toolbar-1',role:'toolbar',runtime:{kind:'vite-dev-server',revision:index.value?.snapshot.revision,inputDigest:index.value?.snapshot.digest}}}
onMounted(()=>{refreshIndex();window.addEventListener('keydown',escape)});
function escape(e:KeyboardEvent){if(e.key==='Escape'){state.open=false;state.categoriesOpen=false}}
onBeforeUnmount(()=>window.removeEventListener('keydown',escape));
if(import.meta.hot){import.meta.hot.on('lab:source-change',refreshIndex);import.meta.hot.dispose(()=>import.meta.hot?.off('lab:source-change',refreshIndex))}
</script>
<template><main class="lab-shell">
 <h1>Paisley Park Component Lab</h1><p>真实 Toolbar.vue · props 手动场景 · 内存回调 · 无游戏实例</p>
 <div class="lab-controls"><label>场景 <select aria-label="Lab 场景" v-model="scenario" @change="changeScene"><option value="ordinary">普通</option><option value="compact">窄／紧凑</option><option value="long">长标题／状态消息</option></select></label><label>预览容器宽度 <input aria-label="预览宽度" type="range" min="320" max="1000" v-model.number="width"> {{width}}px</label></div>
 <p>宽度滑杆仅改变容器几何；narrow/compact 由场景设置，未复用正式父层宽度监听。</p>
 <section class="lab-stage" :style="{width:width+'px'}"><div class="dgshop-host" data-dgu-role="toolbar" data-dgu-component="shop.toolbar" data-dgu-instance="lab-toolbar-1">
  <Toolbar :state="state" :toggle="toggle" :toggleCategories="toggleCategories" :setDefaultGender="setDefaultGender" />
 </div><div id="shopCategories" :hidden="!state.categoriesOpen" class="lab-placeholder">Lab 分类占位目标（非原生游戏列表）</div><div v-if="state.open" class="lab-placeholder" role="region" aria-label="Lab 详情占位">{{state.selectedTitle}} <button @click="toggle">关闭详情</button></div></section>
 <h2>内存回调</h2><pre id="lab-events">{{JSON.stringify(events,null,2)}}</pre>
 <h2>Source Link</h2><p role="status">{{index?'当前相关输入摘要已取得':'索引暂不可用；仍可预览和操作组件'}}</p><details><summary>本地源码索引</summary><pre id="lab-index">{{JSON.stringify(index,null,2)}}</pre></details><details><summary>所选 owned host 线索</summary><pre id="lab-clue">{{JSON.stringify(clue(),null,2)}}</pre></details>
 </main></template>
