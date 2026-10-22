<script setup lang="ts">
import {computed,nextTick,onMounted,onBeforeUnmount,ref,shallowRef,watch} from 'vue';
import {compareReferences,type ReferenceContext,type ReferenceItem} from './reference';
import {sourceMotion} from '../ui/source-motion';
import {visualScope} from '../ui/visual-scope';
const scope=visualScope();
const props=defineProps<{context:ReferenceContext;items:readonly {key:string}[]}>();
const pinned=shallowRef<ReferenceItem>(),selected=shallowRef<ReferenceItem>(),opened=ref(false),spatial=ref(true),message=ref('');
const chip=ref<HTMLElement>(),panel=ref<HTMLElement>();
const panelTop=ref('128px');
const space=ref<HTMLElement>(),narrow=ref(innerWidth<=800);
let resize:ResizeObserver|undefined,withdraw:(()=>void)|undefined;
let layoutWidth=0,viewportWidth=innerWidth,viewportHeight=innerHeight;
let returnTo:HTMLElement|undefined,selectedKey='',epoch=0;
const motion=sourceMotion();
const rows=computed(()=>pinned.value&&selected.value?compareReferences(pinned.value,selected.value):[]);
const differences=computed(()=>rows.value.filter(row=>row.status==='different').length);
const comparable=computed(()=>rows.value.filter(row=>row.status!=='unknown').length);
function interrupt(){epoch++;motion.cancel()}
function visible(node:HTMLElement|undefined){if(!node?.isConnected)return false;const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}
const animate=motion.animate,flight=motion.flight;
function clear(){interrupt();opened.value=false;pinned.value=undefined;selected.value=undefined;returnTo=undefined;selectedKey='';message.value='';withdraw?.();withdraw=undefined}
function valid(){if(props.context.binding.isCurrent())return true;clear();return false}
function position(){if(!opened.value||!returnTo?.isConnected)return;const header=returnTo.closest('.dgw-shell')?.querySelector('.dgw-header');panelTop.value=Math.max(12,Math.min((header?.getBoundingClientRect().bottom??120)+8,innerHeight-170))+'px'}
function layout(event?:Event){if(!scope.active())return;
 const width=space.value?.closest('.dgw-root')?.getBoundingClientRect().width??innerWidth;
 const shifted=event?.type==='scroll'||width!==layoutWidth||innerWidth!==viewportWidth||innerHeight!==viewportHeight;
 layoutWidth=width;viewportWidth=innerWidth;viewportHeight=innerHeight;narrow.value=width<=800;
 // Opening our own content changes height; it must not cancel the transition it just started.
 if(opened.value){if(shifted)interrupt();position()}
}
function publish(){
 withdraw?.();withdraw=props.context.publish?.({id:'wardrobe-reference',title:'衣柜临时参照',setup(context){
  const title=document.createElement('p'),button=document.createElement('button');
  title.textContent=`A · ${pinned.value?.name??'参照已清除'}（只读快照）`;button.type='button';button.textContent='回到衣柜参照';
  const focus=()=>{if(!valid()||!context.isCurrent())return;const target=opened.value?panel.value:chip.value;target?.scrollIntoView({block:'nearest'});(target?.querySelector('button') as HTMLElement|null)?.focus({preventScroll:true})};
  button.addEventListener('click',focus);context.element.append(title,button);return()=>button.removeEventListener('click',focus);
 }});
}
async function choose(key:string,node:HTMLElement){
 if(!valid())return;const fresh=props.context.read(key);if(!fresh){message.value='目录已变化，请重新选择。';return}
 interrupt();const ticket=epoch,source=node.closest<HTMLElement>('.dgw-item-row')??node;
 if(!pinned.value){
  pinned.value=fresh;props.context.remember?.(fresh);publish();message.value='已固定 A，继续浏览衣柜，点另一件衣物旁的“对照”。';const from=source.getBoundingClientRect();
  await nextTick();if(ticket===epoch&&valid()&&chip.value&&visible(source))flight(from,chip.value.getBoundingClientRect(),fresh.name);return;
 }
 selected.value=fresh;selectedKey=key;returnTo=node;opened.value=true;message.value='';
 position();
 const from=visible(source)?source.getBoundingClientRect():undefined;
 await nextTick();if(ticket!==epoch||!valid()||!panel.value)return;
 if(spatial.value&&from){const to=panel.value.getBoundingClientRect();animate(panel.value,[{transformOrigin:'top left',transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(.45)`,opacity:.15,filter:'blur(5px)'},{transformOrigin:'top left',transform:'translate(0,0) scale(1)',opacity:1,filter:'blur(0)'}]);panel.value.querySelectorAll<HTMLElement>('.is-different b').forEach((field,index)=>animate(field,[{opacity:.2,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],360+index*45))}
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
watch(spatial,interrupt);
onMounted(()=>{layout();const root=space.value?.closest('.dgw-root');if(root&&typeof ResizeObserver==='function'){resize=new ResizeObserver(()=>layout());resize.observe(root)}});
window.addEventListener('resize',layout);window.addEventListener('scroll',layout,true);
scope.own(()=>{clear();resize?.disconnect();motion.dispose();props.context.binding.signal.removeEventListener('abort',clear);window.removeEventListener('resize',layout);window.removeEventListener('scroll',layout,true)});onBeforeUnmount(scope.dispose);
defineExpose({choose,hasReference:computed(()=>!!pinned.value),currentKey:computed(()=>opened.value?selectedKey:'')});
</script>
<template>
 <div ref="space" class="dgw-reference-space" :data-compact="narrow||undefined" :data-compare-open="opened||undefined">
 <Teleport to="body" :disabled="!narrow">
  <aside v-if="pinned" ref="chip" class="dgw-reference-chip" aria-label="临时衣物参照" @keydown="key">
   <span class="dgw-reference-marker" aria-hidden="true">A</span><div><small>固定参照 · 只读快照</small><strong>{{pinned.name}}</strong><span>{{pinned.slot}} · {{pinned.colour||'颜色未知'}}</span></div>
   <label title="关闭后使用普通按钮对照路径"><input v-model="spatial" type="checkbox">空间转场</label>
   <button type="button" aria-label="清除参照" @click="clear">×</button>
  </aside>
  <dialog v-if="opened&&pinned&&selected" open ref="panel" :style="{'--dgw-reference-top':panelTop}" class="dgw-reference-compare" aria-modal="false" aria-labelledby="dgw-reference-title" tabindex="-1" @keydown="key">
   <header><div><small>衣柜 · 临时参考</small><h3 id="dgw-reference-title">{{differences?`${differences} 项展示差异`:comparable?'可比较字段没有差异':'暂无可比较字段'}}</h3></div><button data-reference-back type="button" @click="back">返回衣柜</button></header>
   <div class="dgw-reference-pair"><div><small>A · 固定快照</small><strong>{{pinned.name}}</strong><span>{{pinned.slot}}</span></div><div><small>B · 本次目录读取</small><strong>{{selected.name}}</strong><span>{{selected.slot}}</span></div></div>
   <div class="dgw-reference-fields"><div v-for="row in rows" :key="row.field" :class="'is-'+row.status" :data-reference-field="row.field"><span>{{row.label}}<small>{{row.status==='different'?'不同':row.status==='unknown'?'不可比较':'相同'}}</small></span><b><small>A</small>{{row.left===null||row.left===''?'—':row.left}}</b><b><small>B</small>{{row.right===null||row.right===''?'—':row.right}}</b></div></div>
   <details class="dgw-reference-description"><summary>衣物说明</summary><p>A：{{pinned.detail||'没有说明'}}</p><p>B：{{selected.detail||'没有说明'}}</p></details>
   <footer><p>仅比较展示字段，不代表隐藏属性或穿戴效果相同。A 为固定快照，可能已过时。{{pinned.slot!==selected.slot?'部位不同，不代表可相互替换。':''}}</p><span>返回后继续浏览，A 仍保留。</span></footer>
  </dialog>
  <p v-if="message" class="dgw-reference-status" role="status">{{message}}</p>
 </Teleport>
 </div>
</template>
