<script setup lang="ts">
import {computed,ref,toRef,onMounted,onBeforeUnmount,watch} from 'vue';
import type {SaveEntry} from './source';
const props=defineProps<{state:{entries:SaveEntry[];v2:boolean;query:string;selectedSlot:string;pending:boolean;message:string;unknown:number};headerTarget?:HTMLElement;fallback:()=>void;act:(key:number,index:number)=>void|Promise<void>;rename:(key:number,name:string)=>string}>();
const query=toRef(props.state,'query'),selected=ref<number|null>((props.state.entries.find(e=>e.slot===props.state.selectedSlot)||props.state.entries.find(e=>!e.empty))?.key??null),drawer=ref<HTMLDialogElement|null>(null);
const layout=ref<HTMLElement|null>(null),wide=ref(false);
const inline=computed(()=>props.state.v2&&wide.value);
let observer:ResizeObserver|undefined,resizeFrame=0;
function resized(){const next=(layout.value?.parentElement?.getBoundingClientRect().width??0)>=760;if(next===wide.value)return;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;wide.value=next})}
onMounted(()=>{if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resized);if(layout.value?.parentElement)observer.observe(layout.value.parentElement)}else window.addEventListener('resize',resized);resized()});
onBeforeUnmount(()=>{observer?.disconnect();window.removeEventListener('resize',resized);cancelAnimationFrame(resizeFrame)});
watch(inline,()=>{if(drawer.value?.matches(':modal'))drawer.value.close()});
const draftName=ref(''),nameMessage=ref('');
function saveName(){if(current.value)nameMessage.value=props.rename(current.value.key,draftName.value)}
const current=computed(()=>props.state.entries.find(e=>e.key===selected.value));
watch(()=>[current.value?.key,current.value?.customName],()=>{draftName.value=current.value?.customName||''},{immediate:true});
watch(selected,()=>{nameMessage.value=''});
const matches=computed(()=>props.state.entries.filter(e=>`${e.slot} ${e.customName} ${e.name} ${e.description} ${e.date}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
const groups=computed(()=>[
 {title:'自动存档',items:matches.value.filter(e=>e.auto)},
 {title:'手动存档',items:matches.value.filter(e=>!e.auto)}
]);
const backdropPressed=ref(false);
function outsideDrawer(event:MouseEvent){const box=drawer.value?.getBoundingClientRect();return !!box&&event.target===drawer.value&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)}
function dismissBackdrop(event:MouseEvent){if(backdropPressed.value&&outsideDrawer(event))drawer.value?.close();backdropPressed.value=false}
function select(entry:SaveEntry){selected.value=entry.key;props.state.selectedSlot=entry.slot;if(entry.empty&&!entry.auto&&entry.saveAction>=0&&!entry.actions[entry.saveAction]?.disabled){props.act(entry.key,entry.saveAction);return}if(!inline.value)drawer.value?.showModal()}
function act(key:number,index:number){if(!inline.value)drawer.value?.close();props.act(key,index)}
function newSave(){const entry=props.state.entries.find(e=>!e.auto&&e.empty&&e.saveAction>=0&&!e.actions[e.saveAction]?.disabled);if(entry)select(entry)}
</script>
<template>
 <Teleport :to="headerTarget||'body'" :disabled="!headerTarget"><header class="dgs-toolbar" :class="{'dgs-titlebar':headerTarget}"><div><p v-if="headerTarget" class="dgs-eyebrow">YOUR STORY</p><h2>存档管理</h2><p v-if="headerTarget" class="dgs-muted">选择一个存档，查看详情与可用操作。</p></div><button type="button" @click="fallback">原版界面</button></header></Teleport>
 <div ref="layout" class="dgs-layout" :class="{'dgs-v2':inline}">
  <aside class="dgs-list">
   <div class="dgs-search"><button type="button" class="dgs-create" @click="newSave" :disabled="state.pending||!state.entries.some(e=>!e.auto&&e.empty&&e.saveAction>=0&&!e.actions[e.saveAction]?.disabled)">＋ 新建存档</button><input v-model="query" type="search" aria-label="搜索当前页存档" placeholder="搜索当前页存档…"/></div>
   <p class="dgs-muted">点击已有存档查看详情，点击空槽加号保存。</p>
   <p v-if="state.message" role="status" class="dgs-operation-status">{{state.message}}</p>
   <p v-if="state.unknown" class="dgs-muted">{{state.unknown}} 项原版附加内容保留在列表下方；也可切回原版界面。</p>
   <div class="dgs-entries"><template v-for="group in groups" :key="group.title">
    <details v-if="group.items.length" open><summary>{{group.title}} · {{group.items.length}}</summary>
     <div class="dgs-slot-grid"><button v-for="entry in group.items" :key="entry.key" type="button" class="dgs-item" :class="{'dgs-recent':entry.recent,'dgs-empty-slot':entry.empty&&!entry.auto,'dgs-auto':entry.auto,'dgs-feedback-saved':entry.feedback==='saved','dgs-feedback-deleted':entry.feedback==='deleted'}" :aria-pressed="selected===entry.key" @click="select(entry)">
      <span class="dgs-slot">{{entry.slot}}</span><span><strong>{{entry.customName||(entry.auto?'自动存档':entry.empty?'＋ 新建存档':entry.name||`存档 ${entry.slot}`)}}</strong><span v-if="entry.recent" class="dgs-recent-badge">最近保存</span><span class="dgs-dates"><small>{{entry.date}}</small><small v-if="!entry.empty&&entry.gameTime">· {{entry.gameTime}}</small></span><span class="dgs-excerpt">{{entry.description||'尚未保存'}}</span></span>
     </button></div>
    </details>
   </template>
   <p v-if="!matches.length">当前页没有匹配的存档。</p></div><div class="dgs-list-tools"></div>
  </aside>
  <dialog ref="drawer" :open="inline" class="dgs-detail" :class="{'dgs-inline-detail':inline}" aria-label="存档详情" @pointerdown="backdropPressed=outsideDrawer($event)" @click="dismissBackdrop">
   <header class="dgs-detail-header"><span class="dgs-muted">存档详情</span><button v-if="!inline" type="button" class="dgs-close" @click="drawer?.close()">关闭详情</button></header>
   <template v-if="current">
    <div class="dgs-detail-content">
    <p class="dgs-muted">{{current.auto?'自动存档':'手动存档'}} · {{current.slot}} <span v-if="current.recent" class="dgs-recent-badge">最近保存</span></p><h2>{{current.customName||(current.auto?'自动存档':current.empty?'新建存档':current.name||`存档 ${current.slot}`)}}</h2>
    <dl><dt>保存时间</dt><dd>{{current.date||(current.empty?'尚未保存':'未记录')}}</dd><dt>游戏内时间</dt><dd>{{current.gameTime||'未记录'}}</dd><dt>ID / 名称</dt><dd>{{current.name||'—'}}</dd></dl>
    <h3>存档摘要</h3><p class="dgs-description">{{current.description||(current.empty?'这是一个空槽，保存后会记录当前游戏进度。':'此存档未提供摘要。')}}</p>
    <details v-if="!current.empty" class="dgs-rename"><summary>自定义存档名</summary><form class="dgs-name-form" @submit.prevent="saveName"><label>自定义存档名<input v-model="draftName" maxlength="80" placeholder="留空恢复原名称"/></label><button type="submit" :disabled="!current.identity">保存名称</button><small>本地备注，不修改存档内容，不随导出迁移。</small><p role="status">{{nameMessage}}</p></form></details>
    </div>
    <div class="dgs-actions"><button v-for="(action,index) in current.actions" :key="index" type="button" :disabled="state.pending||action.disabled" :class="{'dgs-delete':/删除|Delete/i.test(action.label),'dgs-load':/读取|Load/i.test(action.label)}" @click="act(current.key,index)">{{action.label}}</button></div>
   </template><p v-else>选择左侧存档查看详情。</p>
  </dialog>
 </div>
 <div class="dgs-detail-tools"></div>
</template>

