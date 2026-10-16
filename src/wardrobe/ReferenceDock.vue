<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,ref,shallowRef,watch} from 'vue';
import {compareReferences,type ReferenceContext,type ReferenceItem} from './reference';
const props=defineProps<{context:ReferenceContext;items:readonly {key:string}[]}>();
const pinned=shallowRef<ReferenceItem>(),selected=shallowRef<ReferenceItem>(),opened=ref(false),spatial=ref(true),message=ref('');
const chip=ref<HTMLElement>(),panel=ref<HTMLElement>();
const panelTop=ref('128px');
let returnTo:HTMLElement|undefined,selectedKey='',epoch=0;
const motions=new Set<Animation>(),ghosts=new Set<HTMLElement>();
const rows=computed(()=>pinned.value&&selected.value?compareReferences(pinned.value,selected.value):[]);
const differences=computed(()=>rows.value.filter(row=>row.status==='different').length);
const comparable=computed(()=>rows.value.filter(row=>row.status!=='unknown').length);
const motionMedia=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const reduced=()=>!motionMedia||motionMedia.matches||(document.documentElement.hasAttribute('data-dol-midnight')&&!document.documentElement.hasAttribute('data-dgu-visualMotion'));
function interrupt(){epoch++;for(const animation of motions)animation.cancel();motions.clear();for(const ghost of ghosts)ghost.remove();ghosts.clear()}
function visible(node:HTMLElement|undefined){if(!node?.isConnected)return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}
function animate(node:HTMLElement,frames:Keyframe[],duration=420){
 if(reduced()||typeof node.animate!=='function')return;
 const animation=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});motions.add(animation);
 void animation.finished.catch(()=>{}).finally(()=>{motions.delete(animation);if(ghosts.delete(node))node.remove()});
}
function flight(from:DOMRect,to:DOMRect,name:string){
 if(reduced())return;
 const ghost=document.createElement('div');ghost.className='dgw-reference-flight';ghost.setAttribute('aria-hidden','true');ghost.textContent=name;
 Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:Math.min(from.width,240)+'px'});document.body.append(ghost);ghosts.add(ghost);
 animate(ghost,[{transform:'translate(0,0) scale(1)',opacity:.9},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(.65)`,opacity:0}],480);
 if(!motions.size){ghost.remove();ghosts.delete(ghost)}
}
function clear(){interrupt();opened.value=false;pinned.value=undefined;selected.value=undefined;returnTo=undefined;selectedKey='';message.value=''}
function valid(){if(props.context.binding.isCurrent())return true;clear();return false}
function position(){if(!opened.value||!returnTo?.isConnected)return;const header=returnTo.closest('.dgw-shell')?.querySelector('.dgw-header');panelTop.value=Math.max(12,Math.min((header?.getBoundingClientRect().bottom??120)+8,innerHeight-170))+'px'}
function layout(){if(opened.value){interrupt();position()}}
async function choose(key:string,node:HTMLElement){
 if(!valid())return;const fresh=props.context.read(key);if(!fresh){message.value='目录已变化，请重新选择。';return}
 interrupt();const ticket=epoch,source=node.closest<HTMLElement>('.dgw-item-row')??node;
 if(!pinned.value){
  pinned.value=fresh;message.value='已固定 A，继续浏览衣柜，点另一件衣物旁的“对照”。';const from=source.getBoundingClientRect();
  await nextTick();if(ticket===epoch&&valid()&&chip.value&&visible(source))flight(from,chip.value.getBoundingClientRect(),fresh.name);return;
 }
 selected.value=fresh;selectedKey=key;returnTo=node;opened.value=true;message.value='';
 position();
 const from=visible(source)?source.getBoundingClientRect():undefined;
 await nextTick();if(ticket!==epoch||!valid()||!panel.value)return;
 if(spatial.value&&from){const to=panel.value.getBoundingClientRect();animate(panel.value,[{transformOrigin:'top left',transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(.45)`,opacity:.15,filter:'blur(5px)'},{transformOrigin:'top left',transform:'translate(0,0) scale(1)',opacity:1,filter:'blur(0)'}])}
 panel.value.querySelector<HTMLButtonElement>('[data-reference-back]')?.focus({preventScroll:true});
}
function back(){
 interrupt();const target=returnTo,from=opened.value?panel.value?.getBoundingClientRect():undefined,name=selected.value?.name,current=selectedKey&&props.context.read(selectedKey);
 opened.value=false;selected.value=undefined;selectedKey='';returnTo=undefined;
 if(!valid())return;
 if(current&&visible(target)){if(spatial.value&&from&&name)flight(from,(target!.closest('.dgw-item-row')??target!).getBoundingClientRect(),name);target!.focus({preventScroll:true})}
 else chip.value?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
}
function key(event:KeyboardEvent){if(event.key==='Escape'&&!event.isComposing){event.preventDefault();back()}}
watch(()=>props.items,()=>{if(opened.value&&(!props.items.some(i=>i.key===selectedKey)||!props.context.read(selectedKey)))back()});
props.context.binding.signal.addEventListener('abort',clear,{once:true});
watch(spatial,interrupt);motionMedia?.addEventListener('change',interrupt);
const themeObserver=new MutationObserver(()=>{if(reduced())interrupt()});
themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-dol-midnight','data-dgu-visualMotion']});
window.addEventListener('resize',layout);window.addEventListener('scroll',layout,true);
onBeforeUnmount(()=>{clear();themeObserver.disconnect();props.context.binding.signal.removeEventListener('abort',clear);motionMedia?.removeEventListener('change',interrupt);window.removeEventListener('resize',layout);window.removeEventListener('scroll',layout,true)});
defineExpose({choose,hasReference:computed(()=>!!pinned.value)});
</script>
<template>
 <Teleport to="body">
  <aside v-if="pinned" ref="chip" class="dgw-reference-chip" aria-label="临时衣物参照" @keydown="key">
   <div><small>A · 只读快照</small><strong>{{pinned.name}}</strong><span>{{pinned.slot}} · {{pinned.colour||'颜色未知'}}</span></div>
   <label title="关闭后使用普通按钮对照路径"><input v-model="spatial" type="checkbox">空间转场</label>
   <button type="button" aria-label="清除参照" @click="clear">×</button>
  </aside>
  <dialog v-if="opened&&pinned&&selected" open ref="panel" :style="{'--dgw-reference-top':panelTop}" class="dgw-reference-compare" aria-modal="false" aria-labelledby="dgw-reference-title" tabindex="-1" @keydown="key">
   <header><div><small>衣柜 · 临时参考</small><h3 id="dgw-reference-title">{{differences?`${differences} 项展示差异`:comparable?'可比较字段没有差异':'暂无可比较字段'}}</h3></div><button data-reference-back type="button" @click="back">返回衣柜</button></header>
   <div class="dgw-reference-pair"><div><small>A · 固定快照</small><strong>{{pinned.name}}</strong><span>{{pinned.slot}}</span></div><div><small>B · 本次目录读取</small><strong>{{selected.name}}</strong><span>{{selected.slot}}</span></div></div>
   <div class="dgw-reference-fields"><div v-for="row in rows" :key="row.field" :class="'is-'+row.status" :data-reference-field="row.field"><span>{{row.label}}<small>{{row.status==='different'?'不同':row.status==='unknown'?'不可比较':'相同'}}</small></span><b>{{row.left===null||row.left===''?'—':row.left}}</b><b>{{row.right===null||row.right===''?'—':row.right}}</b></div></div>
   <details class="dgw-reference-description"><summary>衣物说明</summary><p>A：{{pinned.detail||'没有说明'}}</p><p>B：{{selected.detail||'没有说明'}}</p></details>
   <footer><p>仅对照已展示字段，不代表隐藏属性或穿戴效果完全相同。A 是固定快照，可能已过时。{{pinned.slot!==selected.slot?'两件衣物部位不同，不代表能相互替换。':''}}</p><span>参照会保留；返回不改变分类、搜索或穿搭。</span></footer>
  </dialog>
  <p v-if="message" class="dgw-reference-status" role="status">{{message}}</p>
 </Teleport>
</template>
