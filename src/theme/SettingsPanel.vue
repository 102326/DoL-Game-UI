<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type {PanelKind} from '../panels/main';
import FloatingSettings from '../floating/Settings.vue';
import GameButton from '../ui/GameButton.vue';
import SettingsToggle from '../ui/SettingsToggle.vue';
import type {SettingsState,PreferenceKey} from './preferences';
import type {UiApi} from '../public/ui';
import SettingsPreview from './SettingsPreview.vue';
import SettingsNavigation from './SettingsNavigation.vue';
import {sourceMotion} from '../ui/source-motion';
import {workspaceEnterFrames} from '../ui/workspace-transition';
import {visualScope} from '../ui/visual-scope';
import AcrylicControls from './AcrylicControls.vue';
import ReadingControls from './ReadingControls.vue';
import ReadingSample from './ReadingSample.vue';

const props=defineProps<{state:SettingsState;onPreference:(key:PreferenceKey,value:boolean|number)=>void;onSaves:(value:boolean)=>void;onCombat:(value:boolean)=>void;onCharacteristics:(value:boolean)=>void;onSocial:(value:boolean)=>void;onShop:(value:boolean)=>void;onPanel:(kind:PanelKind,value:boolean)=>void;onWardrobe:(value:boolean)=>void;onClose:()=>void;onRecovery:(enabled:boolean)=>void}>();
declare const __STONE_FREE_CONSUMER__:boolean;
const official=(typeof __STONE_FREE_CONSUMER__!=='undefined'&&__STONE_FREE_CONSUMER__)||document.documentElement.hasAttribute('data-stone-free');
// Approved material controls follow the existing official-consumer boundary.
const category=ref<'reading'|'material'|'entry'|'pages'|'advanced'>('reading');
const categories=[{id:'reading',label:'阅读'},{id:'material',label:'材质'},{id:'entry',label:'入口'},{id:'pages',label:'页面'},{id:'advanced',label:'高级'}] as const;
// Private display choice: not a public preference/API or a responsive-mode truth.
const layoutKey='DoLGameUI.settingsLayout.v1',savedLayout=ref<'horizontal'|'vertical'>('horizontal'),layoutMessage=ref('');
try{if(localStorage.getItem(layoutKey)==='vertical')savedLayout.value='vertical'}catch{layoutMessage.value='设置布局暂不能读取，本次使用上下布局。'}
const scope=visualScope(),workspace=ref<HTMLElement>(),workspaceWidth=ref(0),layoutMotion=sourceMotion();scope.own(()=>layoutMotion.dispose());
const effectiveLayout=computed(()=>savedLayout.value==='vertical'&&workspaceWidth.value>=760*Math.max(1,props.state.preferences.fontScale/100)?'vertical':'horizontal');
let layoutRevision=0;
function chooseLayout(value:'horizontal'|'vertical'){savedLayout.value=value;try{localStorage.setItem(layoutKey,value);layoutMessage.value='设置布局已保存。'}catch{layoutMessage.value='本次布局已应用；当前无法保存布局选择。'}}
watch(effectiveLayout,async()=>{
 const ticket=++layoutRevision,nodes=[...workspace.value?.querySelectorAll<HTMLElement>('.dmt-workspace-nav,.dmt-workspace-intro,.dmt-workspace-section>.dmt-control-sheet,.dmt-reading-sample,.dmt-preview-lab')??[]];
 const before=new Map(nodes.map(node=>[node,node.getBoundingClientRect()]));layoutMotion.cancel();await nextTick();
 if(!scope.active()||ticket!==layoutRevision)return;
 for(const [node,from]of before){if(!node.isConnected||!node.getClientRects().length)continue;const to=node.getBoundingClientRect();if(!from.width||!to.width)continue;
  layoutMotion.animate(node,[{transformOrigin:'0 0',transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`},{transformOrigin:'0 0',transform:'translate(0,0) scale(1,1)'}],420);
 }
});
watch(()=>props.state.message,()=>{layoutMessage.value=''});
onMounted(()=>{
 const dialog=workspace.value?.closest('dialog');
 // Do not change the observed layout inside ResizeObserver delivery, or reflow a closed dialog.
 const measure=()=>{const width=workspace.value?.offsetWidth??0;if(dialog?.open&&!dialog.hasAttribute('data-sf-leaving')&&width>0)workspaceWidth.value=width},schedule=()=>scope.frame(measure);
 if(workspace.value&&typeof ResizeObserver==='function'){const resize=new ResizeObserver(schedule);scope.own(()=>resize.disconnect());resize.observe(workspace.value)}
 if(dialog){const visibility=new MutationObserver(()=>{if(!dialog.open||dialog.hasAttribute('data-sf-leaving')){layoutRevision++;layoutMotion.cancel();motion.cancel()}else schedule()});scope.own(()=>visibility.disconnect());visibility.observe(dialog,{attributes:true,attributeFilter:['open','data-sf-leaving']})}schedule();
});
const motion=sourceMotion(),activeTransitions=new Set<symbol>();scope.own(()=>motion.dispose());let direction=1;
function selectCategory(id:string){const item=categories.find(item=>item.id===id);if(!item||item.id===category.value)return;const next=item.id;const from=categories.findIndex(item=>item.id===category.value),to=categories.findIndex(item=>item.id===next);direction=to>=from?1:-1;layoutRevision++;layoutMotion.cancel();motion.cancel();category.value=next}
function transitionTask(element:Element,frames:Keyframe[],done:()=>void){const token=Symbol();activeTransitions.add(token);const dialog=document.getElementById('dol-midnight-controls');dialog?.setAttribute('data-workspace-transition','');let complete=false;const finish=()=>{if(complete)return;complete=true;activeTransitions.delete(token);if(!activeTransitions.size)dialog?.removeAttribute('data-workspace-transition');done()};const animation=motion.animate(element as HTMLElement,frames,620);if(animation)void animation.finished.then(finish,finish);else finish()}
function enterTask(element:Element,done:()=>void){
 element.removeAttribute('inert');element.removeAttribute('aria-hidden');
 transitionTask(element,workspaceEnterFrames(direction),done);
}
function leaveTask(element:Element,done:()=>void){
 element.setAttribute('inert','');element.setAttribute('aria-hidden','true');const origin=direction>0?'100% 0%':'0% 0%';
 transitionTask(element,[
  {transformOrigin:origin,transform:'translate3d(0,0,0) rotateY(0deg)',opacity:1,filter:'blur(0px)'},
  {transformOrigin:origin,transform:`translate3d(${direction*-45}px,0,-100px) rotateY(${direction*20}deg)`,opacity:0,filter:'blur(3px)'}
 ],done);
}
function cancelTask(element:Element){motion.cancel(element as HTMLElement)}
scope.own(()=>{activeTransitions.clear();document.getElementById('dol-midnight-controls')?.removeAttribute('data-workspace-transition')});
onBeforeUnmount(()=>{layoutRevision++;scope.dispose()});
function wardrobeChange(event:Event){const input=event.target as HTMLSelectElement;props.onWardrobe(input.value==='new');input.value=props.state.wardrobe?'new':'original'}
function inspectRuntime(){try{(window as Window & {DoLGameUI?:{ui?:Pick<UiApi,'openInspector'>}}).DoLGameUI?.ui?.openInspector?.()}catch{/* UI diagnostics must not affect settings. */}}
</script>
<template>
 <header class="dmt-settings-header cu:flex cu:items-center cu:justify-between cu:gap-4"><div><p class="dmt-eyebrow">SOFT &amp; WET</p><h2 id="dol-midnight-title">界面设置</h2></div><GameButton class="dmt-close" @click="onClose">关闭</GameButton></header>

 <div v-if="official" class="dmt-layout-choice" role="group" aria-label="设置布局"><span>设置布局</span><GameButton type="button" :aria-pressed="savedLayout==='horizontal'" @click="chooseLayout('horizontal')">上下</GameButton><GameButton type="button" :aria-pressed="savedLayout==='vertical'" @click="chooseLayout('vertical')">左右</GameButton><small v-if="savedLayout!==effectiveLayout">空间较窄，暂用上下布局；保留左右选择。</small></div>
 <div v-if="official" ref="workspace" class="dmt-controls-content dmt-workspace" :data-settings-layout="effectiveLayout" :data-settings-layout-choice="savedLayout">
  <SettingsNavigation :items="categories" :active="category" :layout="effectiveLayout" @select="selectCategory"/>
  <main class="dmt-workspace-page" :aria-label="categories.find(item=>item.id===category)?.label">
   <Transition :css="false" @enter="enterTask" @leave="leaveTask" @enter-cancelled="cancelTask" @leave-cancelled="cancelTask">
   <section v-if="category==='reading'" class="dmt-workspace-section dmt-workspace-reading" aria-labelledby="dmt-reading-heading">
    <div class="dmt-workspace-intro"><p class="dmt-eyebrow">阅读</p><h3 id="dmt-reading-heading">按自己的节奏阅读</h3><p>调整正文密度与常用控件大小，改动会立即生效并自动保存。</p></div>
    <div class="dmt-setting-card dmt-control-sheet dmt-reading-controls">
     <ReadingControls :preferences="state.preferences" @change="onPreference"/>
     <label class="dgu-setting-row"><span><strong>选项文字对齐</strong><small>调整选项、导航与设置标签，正文保持原样。</small></span><select aria-label="选项文字对齐" :value="state.preferences.centerOptions?'center':'left'" @change="onPreference('centerOptions',($event.target as HTMLSelectElement).value==='center')"><option value="left">原样 / 靠左</option><option value="center">居中</option></select></label>
     <label v-for="item in ([{key:'fontScale',label:'字体'},{key:'buttonScale',label:'按钮'}] as const)" :key="item.key" class="dgu-setting-row"><span><strong>{{item.label}} {{state.preferences[item.key]}}%</strong><small>{{item.key==='fontScale'?'调整正文与自有界面的字号，图片保持原大小。':'调整按钮文字与留白，保留触控区域。'}}</small></span><input type="range" min="50" max="150" step="5" :aria-label="item.label+'大小'" :value="state.preferences[item.key]" @input="onPreference(item.key,Number(($event.target as HTMLInputElement).value))"/></label>
     <div class="dmt-workspace-actions"><GameButton @click="onPreference('fontScale',100);onPreference('buttonScale',100)">恢复 100%</GameButton><p>字号和按钮范围均为 50%–150%，默认 100%。图片保持原大小。</p></div>
     <SettingsToggle label="手机紧凑按钮间距" description="缩小操作控件的留白，保留至少 44px 点击区域；仅在手机尺寸生效" :checked="state.preferences.mobileCompactControls" @change="onPreference('mobileCompactControls',$event)"/>
    </div>
    <ReadingSample :preferences="state.preferences"/>
   </section>

   <section v-else-if="category==='material'" class="dmt-workspace-section dmt-workspace-material" aria-labelledby="dmt-material-heading">
    <div class="dmt-workspace-intro"><p class="dmt-eyebrow">材质</p><h3 id="dmt-material-heading">看见层次如何变化</h3><p>预览会使用当前材质与动效设置。预览操作不会改动游戏内容。</p></div>
    <div class="dmt-setting-card dmt-control-sheet dmt-material-controls">
     <SettingsToggle label="玻璃模糊" description="柔化界面后方的背景细节。" :checked="state.preferences.visualGlass" @change="onPreference('visualGlass',$event)"/>
     <AcrylicControls v-if="official" :value="state.preferences.acrylicTransparency" :disabled="!state.preferences.visualGlass" @change="onPreference('acrylicTransparency',$event)"/>
     <SettingsToggle label="交互与进入动画" description="控制窗口和切换动效；系统减少动态效果设置优先。" :checked="state.preferences.visualMotion" @change="onPreference('visualMotion',$event)"/>
     <SettingsToggle label="交互层次反馈" description="只调整选中项的额外层次反馈；不改变主体配色或游戏状态" :checked="state.preferences.visualGlow" @change="onPreference('visualGlow',$event)"/>
     <SettingsToggle label="标题边缘纹样" description="可选静态装饰" :checked="state.preferences.visualPattern" @change="onPreference('visualPattern',$event)"/>
     <p>当前主体材质默认使用完整表现。关闭动画或系统减少动态效果时，操作仍会立即完成。</p>
    </div>
    <SettingsPreview :state="state"/>
   </section>

   <section v-else-if="category==='entry'" class="dmt-workspace-section" aria-labelledby="dmt-entry-heading">
    <div class="dmt-workspace-intro"><p class="dmt-eyebrow">入口与布局</p><h3 id="dmt-entry-heading">决定界面从哪里开始</h3><p>这些设置只影响页面入口与排布，不改变游戏状态。</p></div>
    <div class="dmt-setting-card dmt-control-sheet">
     <SettingsToggle label="启用响应式布局" description="适配手机抽屉与平板侧栏；关闭可恢复原版布局" :checked="state.preferences.layout" @change="onPreference('layout',$event)"/>
     <p>角色状态保持展开。折叠侧栏沿用游戏原有操作。</p>
    </div>
    <FloatingSettings/>
   </section>

   <section v-else-if="category==='pages'" class="dmt-workspace-section" aria-labelledby="dmt-pages-heading">
    <div class="dmt-workspace-intro"><p class="dmt-eyebrow">页面</p><h3 id="dmt-pages-heading">选择使用哪些 Soft &amp; Wet 页面</h3><p>每项可以单独切回原版；偏好自动保存。</p></div>
    <details class="dmt-setting-card dmt-control-sheet dmt-page-switches"><summary><strong>各页面与兼容开关</strong><span>按页面切回原版</span></summary>
     <SettingsToggle label="启用新版存档界面" :checked="state.saves" @change="onSaves"/>
     <SettingsToggle label="启用新版服装店" :checked="state.shop" @change="onShop"/>
     <SettingsToggle label="启用新版日志与笔记" :checked="state.panels.journal" @change="onPanel('journal',$event)"/>
     <SettingsToggle label="启用新版特质界面" :checked="state.panels.traits" @change="onPanel('traits',$event)"/>
     <SettingsToggle label="启用新版统计界面" :checked="state.panels.statistics" @change="onPanel('statistics',$event)"/>
     <SettingsToggle label="启用态度界面美化" :checked="state.panels.attitudes" @change="onPanel('attitudes',$event)"/>
     <SettingsToggle label="启用游戏设置美化" :checked="state.panels.settings" @change="onPanel('settings',$event)"/>
     <SettingsToggle label="启用作弊界面美化" :checked="state.panels.cheats" @change="onPanel('cheats',$event)"/>
     <SettingsToggle label="启用新版成就界面" :checked="state.panels.feats" @change="onPanel('feats',$event)"/>
     <SettingsToggle label="启用新版社交界面" :checked="state.social" @change="onSocial"/>
     <SettingsToggle label="启用新版属性界面" :checked="state.characteristics" @change="onCharacteristics"/>
     <SettingsToggle label="启用新版战斗界面" :checked="state.combat" @change="onCombat"/>
     <SettingsToggle label="战斗聚焦编辑（实验）" description="默认平铺显示原版战斗控件；开启后聚焦单组动作，关闭后恢复全部平铺" :checked="state.preferences.combatFocused" @change="onPreference('combatFocused',$event)"/>
    </details>
    <div class="dmt-setting-card dmt-control-sheet">
     <h3>衣柜与存档</h3>
     <SettingsToggle v-if="state.saves" label="存档 V2 双栏详情" description="宽屏并排显示列表与详情；窄屏使用弹出详情" :checked="state.preferences.savesV2" @change="onPreference('savesV2',$event)"/>
     <label class="dgu-setting-row" for="dmt-wardrobe"><span><strong>衣柜界面</strong><small>切换穿搭面板与原版衣柜；不改动衣物数据。</small></span><select id="dmt-wardrobe" aria-label="衣柜界面" :value="state.wardrobe?'new':'original'" @change="wardrobeChange"><option value="new">新版穿搭衣柜</option><option value="original">原版衣柜（兼容回退）</option></select></label>
     <SettingsToggle v-if="state.wardrobe" label="衣柜按页渲染" description="每页显示 40 件；搜索、排序和全选仍覆盖整个分类" :checked="state.preferences.wardrobePaged" @change="onPreference('wardrobePaged',$event)"/>
     <p>这些选项只调整显示，不改变存档或衣物数据。</p>
    </div>
   </section>

   <section v-else class="dmt-workspace-section" aria-labelledby="dmt-advanced-heading">
    <div class="dmt-workspace-intro"><p class="dmt-eyebrow">高级</p><h3 id="dmt-advanced-heading">兼容与恢复</h3><p>仅在需要时调整；遇到异常可以单独关闭。</p></div>
    <details class="dmt-setting-card dmt-control-sheet dmt-experiments"><summary><strong>兼容回退与实验选项</strong><span>默认收起，按需调整</span></summary>
     <SettingsToggle label="衣柜延迟原版隐藏列表（实验）" description="减少换装后隐藏列表的刷新；第三方衣柜信息异常时关闭。" :checked="state.preferences.wardrobeHiddenList" @change="onPreference('wardrobeHiddenList',$event)"/>
     <SettingsToggle label="商店离屏绘制延后（实验）" description="暂缓屏幕外商品的绘制；滚动缺块或位置异常时关闭。" :checked="state.preferences.shopDeferredPaint" @change="onPreference('shopDeferredPaint',$event)"/>
     <SettingsToggle v-if="state.shopPageExperimentAvailable" label="商店按页生成（实验）" description="只创建当前页商品，下次进入商店生效；筛选或翻页异常时关闭。" :checked="state.preferences.shopPageExperiment" @change="onPreference('shopPageExperiment',$event)"/>
     <p>这些选项默认关闭；不会改变购买、换装与存档规则。</p>
    </details>
    <section class="dmt-setting-card dmt-control-sheet"><h3>原版回退</h3><p>关闭 Soft &amp; Wet 后返回原版界面；重新启用会恢复保留的页面与显示选择。游戏进度与模组配置不受影响。</p><div class="dmt-recovery cu:flex cu:flex-wrap cu:gap-2"><GameButton @click="onRecovery(false)">回退原版界面</GameButton><GameButton @click="onRecovery(true)">启用新版界面</GameButton></div></section>
    <details class="dmt-setting-card dmt-debug"><summary><strong>问题诊断</strong><span>仅排查问题时使用</span></summary><GameButton :disabled="!state.preferences.enabled" @click="inspectRuntime">Runtime Inspector</GameButton><p>只读查看能力、Adapter 和降级原因；可复制诊断。需要启用 Soft &amp; Wet。</p></details>
   </section>
   </Transition>
  </main>
 </div>

 <div v-else class="dmt-controls-content cu:grid cu:gap-4 cu:md:grid-cols-2">
  <section class="dmt-setting-card"><h3>主题与阅读</h3>
   <ReadingControls :preferences="state.preferences" @change="onPreference"/>
   <label class="dgu-setting-row"><span><strong>选项文字对齐</strong></span><select aria-label="选项文字对齐" :value="state.preferences.centerOptions?'center':'left'" @change="onPreference('centerOptions',($event.target as HTMLSelectElement).value==='center')"><option value="left">原样 / 靠左</option><option value="center">居中</option></select></label>
  </section>
  <section class="dmt-setting-card"><h3>材质与动效</h3>
   <label class="dgu-setting-row"><span><strong>效果档位</strong><small>流畅档关闭模糊；均衡与华丽增加材质表现。</small></span><select aria-label="视觉效果档位" :value="state.preferences.visualTier" @change="onPreference('visualTier',Number(($event.target as HTMLSelectElement).value))"><option :value="0">流畅</option><option :value="1">均衡</option><option :value="2">华丽</option></select></label>
   <SettingsToggle label="玻璃模糊" description="柔化界面后方的背景细节。" :checked="state.preferences.visualGlass" @change="onPreference('visualGlass',$event)"/>
   <SettingsToggle label="交互与进入动画" description="控制窗口和切换动效；系统减少动态效果设置优先。" :checked="state.preferences.visualMotion" @change="onPreference('visualMotion',$event)"/>
   <SettingsToggle label="光影高光" description="增加表面的高光与选中反馈。" :checked="state.preferences.visualGlow" @change="onPreference('visualGlow',$event)"/>
   <SettingsToggle label="标题边缘纹样" description="可选静态装饰" :checked="state.preferences.visualPattern" @change="onPreference('visualPattern',$event)"/>
   <p>流畅档不使用模糊。均衡与华丽共享布局，主要区别是材质强度；系统减少动态效果设置优先。</p>
  </section>
  <section class="dmt-setting-card"><h3>字体与按钮大小</h3><p>调整主界面与弹窗；侧边栏与模组管理弹窗保持原有大小。</p>
   <label v-for="item in ([{key:'fontScale',label:'字体'},{key:'buttonScale',label:'按钮'}] as const)" :key="item.key" class="dgu-setting-row"><span><strong>{{item.label}} {{state.preferences[item.key]}}%</strong><small>{{item.key==='fontScale'?'调整正文与自有界面的字号，图片保持原大小。':'调整按钮文字与留白，保留触控区域。'}}</small></span><input type="range" min="50" max="150" step="5" :aria-label="item.label+'大小'" :value="state.preferences[item.key]" @input="onPreference(item.key,Number(($event.target as HTMLInputElement).value))"/></label>
   <GameButton @click="onPreference('fontScale',100);onPreference('buttonScale',100)">恢复 100%</GameButton><p>字号和按钮范围均为 50%–150%，默认 100%。图片保持原大小。</p>
   <SettingsToggle label="手机紧凑按钮间距" description="缩小操作控件的留白，保留至少 44px 点击区域；仅在手机尺寸生效" :checked="state.preferences.mobileCompactControls" @change="onPreference('mobileCompactControls',$event)"/>
  </section>
  <section class="dmt-setting-card"><h3>侧栏与布局</h3>
   <SettingsToggle label="启用响应式布局" description="适配手机抽屉与平板侧栏；关闭可恢复原版布局" :checked="state.preferences.layout" @change="onPreference('layout',$event)"/>
   <p>角色状态保持展开。折叠侧栏沿用游戏原有操作。</p>
  </section>
  <details class="dmt-setting-card dmt-page-switches"><summary><strong>各页面与兼容开关</strong><span>按页面切回原版</span></summary>
   <SettingsToggle label="启用新版存档界面" :checked="state.saves" @change="onSaves"/>
   <SettingsToggle label="启用新版服装店" :checked="state.shop" @change="onShop"/>
   <SettingsToggle label="启用新版日志与笔记" :checked="state.panels.journal" @change="onPanel('journal',$event)"/>
   <SettingsToggle label="启用新版特质界面" :checked="state.panels.traits" @change="onPanel('traits',$event)"/>
   <SettingsToggle label="启用新版统计界面" :checked="state.panels.statistics" @change="onPanel('statistics',$event)"/>
   <SettingsToggle label="启用态度界面美化" :checked="state.panels.attitudes" @change="onPanel('attitudes',$event)"/>
   <SettingsToggle label="启用游戏设置美化" :checked="state.panels.settings" @change="onPanel('settings',$event)"/>
   <SettingsToggle label="启用作弊界面美化" :checked="state.panels.cheats" @change="onPanel('cheats',$event)"/>
   <SettingsToggle label="启用新版成就界面" :checked="state.panels.feats" @change="onPanel('feats',$event)"/>
   <SettingsToggle label="启用新版社交界面" :checked="state.social" @change="onSocial"/>
   <SettingsToggle label="启用新版属性界面" :checked="state.characteristics" @change="onCharacteristics"/>
   <SettingsToggle label="启用新版战斗界面" :checked="state.combat" @change="onCombat"/>
  </details>
  <section class="dmt-setting-card"><h3>存档与衣柜</h3>
   <SettingsToggle v-if="state.saves" label="存档 V2 双栏详情" description="宽屏并排显示列表与详情；窄屏使用弹出详情" :checked="state.preferences.savesV2" @change="onPreference('savesV2',$event)"/>
   <label class="dgu-setting-row" for="dmt-wardrobe"><span><strong>衣柜界面</strong><small>切换穿搭面板与原版衣柜；不改动衣物数据。</small></span><select id="dmt-wardrobe" aria-label="衣柜界面" :value="state.wardrobe?'new':'original'" @change="wardrobeChange"><option value="new">新版穿搭衣柜</option><option value="original">原版衣柜（兼容回退）</option></select></label>
   <SettingsToggle v-if="state.wardrobe" label="衣柜按页渲染" description="每页显示 40 件；搜索、排序和全选仍覆盖整个分类" :checked="state.preferences.wardrobePaged" @change="onPreference('wardrobePaged',$event)"/>
   <p>这些选项只调整显示，不改变存档或衣物数据。</p>
  </section>
  <details class="dmt-setting-card dmt-experiments"><summary><strong>兼容回退与实验选项</strong><span>默认收起，按需调整</span></summary>
   <SettingsToggle label="衣柜延迟原版隐藏列表（实验）" description="减少换装后隐藏列表的刷新；第三方衣柜信息异常时关闭。" :checked="state.preferences.wardrobeHiddenList" @change="onPreference('wardrobeHiddenList',$event)"/>
   <SettingsToggle label="商店离屏绘制延后（实验）" description="暂缓屏幕外商品的绘制；滚动缺块或位置异常时关闭。" :checked="state.preferences.shopDeferredPaint" @change="onPreference('shopDeferredPaint',$event)"/>
   <SettingsToggle v-if="state.shopPageExperimentAvailable" label="商店按页生成（实验）" description="只创建当前页商品，下次进入商店生效；筛选或翻页异常时关闭。" :checked="state.preferences.shopPageExperiment" @change="onPreference('shopPageExperiment',$event)"/>
   <p>这些选项默认关闭；仅在需要时开启，出现异常可单独关闭。不会改变购买、换装与存档规则。</p>
  </details>
  <FloatingSettings/>
  <section class="dmt-setting-card"><h3>兼容回退</h3><p>关闭 Soft &amp; Wet 后返回原版界面；重新启用会恢复保留的页面与显示选择。游戏进度与模组配置不受影响。</p><div class="dmt-recovery cu:flex cu:flex-wrap cu:gap-2"><GameButton @click="onRecovery(false)">回退原版界面</GameButton><GameButton @click="onRecovery(true)">启用新版界面</GameButton></div></section>
  <details class="dmt-setting-card dmt-debug cu:md:col-span-2"><summary><strong>问题诊断</strong><span>仅排查问题时使用</span></summary><GameButton :disabled="!state.preferences.enabled" @click="inspectRuntime">Runtime Inspector</GameButton><p>只读查看能力、Adapter 和降级原因；可复制诊断。需要启用 Soft &amp; Wet。</p></details>
 </div>
 <footer class="dmt-settings-footer"><p role="status">{{layoutMessage||state.message}}</p></footer>
</template>

<style src="./settings-workspace.css"></style>
<style src="./acrylic-v1.css"></style>
<style src="./acrylic-adjustment.css"></style>
<style src="./option-alignment.css"></style>
<style src="./workspace-theme.css"></style>
