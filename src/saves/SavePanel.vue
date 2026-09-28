<script setup lang="ts">
import {computed,ref} from 'vue';
import type {SaveEntry} from './main';
const props=defineProps<{state:{entries:SaveEntry[]};fallback:()=>void;act:(key:number,index:number)=>void}>();
const query=ref(''),selected=ref<number|null>(props.state.entries.find(e=>!e.empty)?.key??null),mobileDetail=ref(false);
const current=computed(()=>props.state.entries.find(e=>e.key===selected.value));
const matches=computed(()=>props.state.entries.filter(e=>`${e.slot} ${e.name} ${e.description} ${e.date}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
const groups=computed(()=>[
 {title:'自动存档',items:matches.value.filter(e=>e.auto),empty:false},
 {title:'手动存档',items:matches.value.filter(e=>!e.auto&&!e.empty),empty:false},
 {title:'空存档槽',items:matches.value.filter(e=>!e.auto&&e.empty),empty:true}
]);
function select(entry:SaveEntry){selected.value=entry.key;mobileDetail.value=true}
function newSave(){const entry=props.state.entries.find(e=>!e.auto&&e.empty&&e.actions.some(a=>!a.disabled));if(entry)select(entry)}
</script>
<template>
 <header class="dgs-toolbar"><h2>存档管理</h2><button type="button" @click="fallback">原版界面</button></header>
 <div class="dgs-layout" :class="{'dgs-detail-open':mobileDetail}">
  <aside class="dgs-list">
   <div class="dgs-search"><button type="button" @click="newSave" :disabled="!state.entries.some(e=>!e.auto&&e.empty&&e.actions.some(a=>!a.disabled))">＋ 新建存档</button><input v-model="query" type="search" aria-label="搜索当前页存档" placeholder="搜索当前页存档…"/></div>
   <p class="dgs-muted">选择存档查看详情；新建后仍需点击保存。</p>
   <template v-for="group in groups" :key="group.title">
    <details v-if="group.items.length" :open="!group.empty||!!query"><summary>{{group.title}} · {{group.items.length}}</summary>
     <button v-for="entry in group.items" :key="entry.key" type="button" class="dgs-item" :aria-pressed="selected===entry.key" @click="select(entry)">
      <span class="dgs-slot">{{entry.slot}}</span><span><strong>{{entry.auto?'自动存档':entry.empty?'空存档':entry.name||`存档 ${entry.slot}`}}</strong><small>{{entry.date}}</small><span class="dgs-excerpt">{{entry.description||'尚未保存'}}</span></span>
     </button>
    </details>
   </template>
   <p v-if="!matches.length">当前页没有匹配的存档。</p>
  </aside>
  <article class="dgs-detail">
   <button type="button" class="dgs-back" @click="mobileDetail=false">← 返回列表</button>
   <template v-if="current">
    <p class="dgs-muted">{{current.auto?'自动存档':'手动存档'}} · {{current.slot}}</p><h2>{{current.empty?'新建存档':current.name||`存档 ${current.slot}`}}</h2>
    <dl><dt>保存时间</dt><dd>{{current.date||'尚未保存'}}</dd><dt>ID / 名称</dt><dd>{{current.name||'—'}}</dd></dl>
    <h3>存档摘要</h3><p class="dgs-description">{{current.description||'这是一个空槽，保存后会记录当前游戏进度。'}}</p>
    <div class="dgs-actions"><button v-for="(action,index) in current.actions" :key="index" type="button" :disabled="action.disabled" :class="{'dgs-delete':/删除|Delete/i.test(action.label)}" @click="act(current.key,index)">{{action.label}}</button></div>
   </template><p v-else>选择左侧存档查看详情。</p>
  </article>
 </div>
</template>
