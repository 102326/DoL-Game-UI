<script setup lang="ts">
import {reactive,ref,onMounted,onBeforeUnmount} from 'vue';
import Toolbar from '../src/shop/Toolbar.vue';
import FloatingTools from '../src/floating/FloatingTools.vue';
import type {FloatingState} from '../src/floating/main';
const component=ref('floating.tools'),glass=ref(true),tier=ref('1');
const floating=reactive<FloatingState>({x:160,y:320,intentX:.5,intentY:.5,open:true,mode:'grid',config:false,dragging:false,menuX:-130,menuY:-250,menuWidth:280,menuMaxHeight:480,message:'',fan:[{x:0,y:70},{x:94,y:0},{x:188,y:70}],tools:[{id:'settings',name:'界面设置',icon:'⚙',description:'Lab 内存回调',reason:''},{id:'inspector',name:'开发检查',icon:'⌕',description:'Lab 内存回调',reason:''},{id:'move',name:'移动悬浮球',icon:'✥',description:'Lab 内存回调',reason:''}]});
function floatingRun(id:string){record('floating.run',id);if(id==='move')floating.config=true;else floating.message='仅记录 Lab 回调：'+id}
function updateGlass(){document.documentElement.toggleAttribute('data-dgu-visualGlass',glass.value);document.documentElement.setAttribute('data-dgu-visual',tier.value)}
function noGesture(){record('pointer','Lab 不接入生产拖动算法')}
const scenario=ref('ordinary'),width=ref(960),index=ref<any>(null),events=ref<{name:string;value:unknown}[]>([]);
const state=reactive({hasDetails:true,isEntry:false,open:false,narrow:false,compact:false,categoriesOpen:false,selectedTitle:'虚构样品',referenceEnabled:false,referenceA:null,comparisonB:null,comparisonTarget:null,comparisonOrigin:null,defaultGender:'game',message:''});
const record=(name:string,value:unknown)=>{events.value=[...events.value.slice(-15),{name,value}]};
function setDefaultGender(value:string){state.defaultGender=value;state.message='Lab 内存分类：'+value;record('setDefaultGender',value)}
function toggleCategories(){state.categoriesOpen=!state.categoriesOpen;record('toggleCategories',state.categoriesOpen)}
function toggle(){state.open=!state.open;record('toggle',state.open)}
function changeScene(){Object.assign(state,{open:false,categoriesOpen:false,message:'',narrow:scenario.value!=='ordinary',compact:scenario.value==='compact',selectedTitle:scenario.value==='long'?'用于预览的较长标题：同源组件与局部状态测试，不执行游戏购买或偏好写入':'虚构样品'});width.value=scenario.value==='ordinary'?960:scenario.value==='compact'?360:550;if(scenario.value==='long')state.message='这是一段较长的 Lab 状态消息，仅检查当前组件的文本换行与控件可达性。'}
async function refreshIndex(){index.value=null;try{const next=await(await fetch('/__lab/source-index?component='+component.value,{cache:'no-store'})).json();index.value=next.format==='dol-ui-source-index'?next:null}catch{index.value=null}}
function clue(){return {format:'dol-ui-source-clue',version:1,componentId:component.value,instanceId:component.value==='shop.toolbar'?'lab-toolbar-1':'lab-floating-1',role:component.value==='shop.toolbar'?'toolbar':'floating',runtime:{kind:'vite-dev-server',revision:index.value?.snapshot.revision,inputDigest:index.value?.snapshot.digest}}}
onMounted(()=>{refreshIndex();updateGlass();window.addEventListener('keydown',escape)});
function escape(e:KeyboardEvent){if(e.key==='Escape'){state.open=false;state.categoriesOpen=false}}
onBeforeUnmount(()=>window.removeEventListener('keydown',escape));
if(import.meta.hot){import.meta.hot.on('lab:source-change',refreshIndex);import.meta.hot.dispose(()=>import.meta.hot?.off('lab:source-change',refreshIndex))}
</script>
<template><main class="lab-shell">
 <h1>Stone Free Component Lab</h1><p>当前 3.0 真实组件 · props 手动场景 · 内存回调 · 无游戏实例</p>
 <label>组件 <select aria-label="Lab 组件" v-model="component" @change="refreshIndex"><option value="floating.tools">悬浮工具</option><option value="shop.toolbar">商店工具栏</option></select></label>
 <div class="lab-controls"><label>场景 <select aria-label="Lab 场景" v-model="scenario" @change="changeScene"><option value="ordinary">普通</option><option value="compact">窄／紧凑</option><option value="long">长标题／状态消息</option></select></label><label>预览容器宽度 <input aria-label="预览宽度" type="range" min="320" max="1000" v-model.number="width"> {{width}}px</label></div>
 <p>宽度滑杆仅改变容器几何；narrow/compact 由场景设置，未复用正式父层宽度监听。</p>
 <section v-if="component==='shop.toolbar'" class="lab-stage" :style="{width:width+'px'}"><div class="dgshop-host" data-dgu-role="toolbar" data-dgu-component="shop.toolbar" data-dgu-instance="lab-toolbar-1">
  <Toolbar :state="state" :toggle="toggle" :toggleCategories="toggleCategories" :setDefaultGender="setDefaultGender" :pinReference="()=>record('reference','Lab only')" :compareReference="()=>record('compare','Lab only')" :clearReference="()=>record('clearReference','Lab only')" :closeComparison="()=>record('closeComparison','Lab only')" />
 </div><div id="shopCategories" :hidden="!state.categoriesOpen" class="lab-placeholder">Lab 分类占位目标（非原生游戏列表）</div><div v-if="state.open" class="lab-placeholder" role="region" aria-label="Lab 详情占位">{{state.selectedTitle}} <button @click="toggle">关闭详情</button></div></section>
 <section v-else class="lab-floating lab-stage" :style="{width:width+'px'}">
  <p>悬浮球位置和菜单几何是手动 props，不代表生产拖动、自动避让或游戏操作验收。</p>
  <label>展开 <input type="checkbox" aria-label="Lab 展开悬浮菜单" v-model="floating.open"></label>
  <label>模式 <select aria-label="Lab 悬浮模式" v-model="floating.mode"><option value="fan">扇形</option><option value="grid">网格</option></select></label>
  <label>视觉档位 <select aria-label="Lab 视觉档位" v-model="tier" @change="updateGlass"><option value="1">Balanced</option><option value="2">Fancy</option></select></label>
  <label>玻璃 <input type="checkbox" aria-label="Lab 玻璃" v-model="glass" @change="updateGlass"></label>
  <div id="dol-stone-free-floating" data-dgu-component="floating.tools" data-dgu-role="floating" data-dgu-instance="lab-floating-1">
   <FloatingTools :state="floating" :toggle="()=>floating.open=!floating.open" :down="noGesture" :move="noGesture" :up="noGesture" :cancel="noGesture" :run="floatingRun" :grid="()=>floating.mode='grid'" :close="()=>{floating.open=false;floating.config=false}" :configure="()=>floating.config=true" :hide="()=>floating.open=false" :position="(axis,value)=>{record('position.'+axis,value)}" :lock="noGesture" :unlock="noGesture" :guard="()=>{}" />
  </div>
 </section>
 <h2>内存回调</h2><pre id="lab-events">{{JSON.stringify(events,null,2)}}</pre>
 <h2>Source Link</h2><p role="status">{{index?'当前相关输入摘要已取得':'索引暂不可用；仍可预览和操作组件'}}</p><details><summary>本地源码索引</summary><pre id="lab-index">{{JSON.stringify(index,null,2)}}</pre></details><details><summary>所选 owned host 线索</summary><pre id="lab-clue">{{JSON.stringify(clue(),null,2)}}</pre></details>
 </main></template>
