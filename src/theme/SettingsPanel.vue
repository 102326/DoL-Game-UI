<script setup lang="ts">
import type {PanelKind} from '../panels/main';
import GameButton from '../ui/GameButton.vue';
import SettingsToggle from '../ui/SettingsToggle.vue';
import type {SettingsState,PreferenceKey} from './preferences';
const props=defineProps<{state:SettingsState;onPreference:(key:PreferenceKey,value:boolean|number)=>void;onSaves:(value:boolean)=>void;onCombat:(value:boolean)=>void;onCharacteristics:(value:boolean)=>void;onSocial:(value:boolean)=>void;onShop:(value:boolean)=>void;onPanel:(kind:PanelKind,value:boolean)=>void;onWardrobe:(value:boolean)=>void;onClose:()=>void;onRecovery:(enabled:boolean)=>void}>();
function wardrobeChange(event:Event){const input=event.target as HTMLSelectElement;props.onWardrobe(input.value==='new');input.value=props.state.wardrobe?'new':'original'}
</script>
<template>
 <header class="dmt-settings-header cu:flex cu:items-center cu:justify-between cu:gap-4"><div><p class="dmt-eyebrow">GAME UI</p><h2 id="dol-midnight-title">界面设置</h2></div><GameButton class="dmt-close" @click="onClose">关闭</GameButton></header>
 <div class="dmt-controls-content cu:grid cu:gap-4 cu:md:grid-cols-2">
  <section class="dmt-setting-card"><h3>主题与阅读</h3>
   <SettingsToggle label="启用炭黑主题" description="统一页面配色与基础控件" :checked="state.preferences.enabled" @change="onPreference('enabled',$event)"/>
   <SettingsToggle label="舒适阅读间距" :checked="state.preferences.comfortable" @change="onPreference('comfortable',$event)"/>
   <SettingsToggle label="宽幅正文" :checked="state.preferences.wideReading" @change="onPreference('wideReading',$event)"/>
  </section>
  <section class="dmt-setting-card"><h3>字体与按钮大小</h3><p>调整主界面与弹窗；侧边栏与模组管理弹窗保持原有大小。</p>
<label v-for="item in ([{key:'fontScale',label:'字体'},{key:'buttonScale',label:'按钮'}] as const)" :key="item.key" class="dgu-setting-row"><span>{{item.label}} {{state.preferences[item.key]}}%</span><input type="range" min="50" max="200" step="5" :aria-label="item.label+'大小'" :value="state.preferences[item.key]" @input="onPreference(item.key,Number(($event.target as HTMLInputElement).value))"/></label>
<GameButton @click="onPreference('fontScale',100);onPreference('buttonScale',100)">恢复 100%</GameButton><p>分别调整文字与按钮间距；图片保持原大小。</p></section>
<section class="dmt-setting-card"><h3>侧栏与布局</h3>
   <SettingsToggle label="启用响应式布局" description="适配手机抽屉与平板侧栏；关闭可恢复原版布局" :checked="state.preferences.layout" @change="onPreference('layout',$event)"/>
   <SettingsToggle label="紧凑状态间距" :checked="state.preferences.compactStats" @change="onPreference('compactStats',$event)"/>
   <p>角色状态保持展开。折叠侧栏沿用游戏原有操作。</p>
  </section>
  <section class="dmt-setting-card"><h3>专用界面</h3>
   <SettingsToggle label="启用新版存档界面" :checked="state.saves" @change="onSaves"/>
   <SettingsToggle label="存档 V2 双栏详情" description="宽屏并排显示列表与详情；窄屏自动使用弹出详情" :checked="state.preferences.savesV2" @change="onPreference('savesV2',$event)"/>
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
   <label class="dgu-setting-row" for="dmt-wardrobe"><span><strong>衣柜界面</strong></span><select id="dmt-wardrobe" aria-label="衣柜界面" :value="state.wardrobe?'new':'original'" @change="wardrobeChange"><option value="new">新版穿搭衣柜</option><option value="original">原版衣柜（兼容回退）</option></select></label>
  </section>
  <section class="dmt-setting-card"><h3>列表显示</h3>
   <SettingsToggle label="衣柜按页渲染" description="默认只生成当前页的40件衣物；搜索、排序和全选仍覆盖整个分类。出现兼容问题时可关闭" :checked="state.preferences.wardrobePaged" @change="onPreference('wardrobePaged',$event)"/>
   <p>这是新版衣柜的默认显示方式，不会改变衣物数据、穿戴规则或存档内容。</p>
  </section>
  <details class="dmt-setting-card dmt-experiments"><summary><strong>进阶实验</strong><span>展开调整，现有设置保持不变</span></summary>
   <SettingsToggle label="衣柜延迟原版隐藏列表（实验）" description="新版衣柜换装时暂不重建隐藏的原版列表；出现兼容问题时关闭此项" :checked="state.preferences.wardrobeHiddenList" @change="onPreference('wardrobeHiddenList',$event)"/>
   <SettingsToggle label="商店离屏绘制延后（实验）" description="让支持的浏览器跳过屏幕外商品的排版与绘制；滚动异常时关闭此项" :checked="state.preferences.shopDeferredPaint" @change="onPreference('shopDeferredPaint',$event)"/>
   <SettingsToggle v-if="state.shopPageExperimentAvailable" label="商店按页生成（实验）" description="只生成当前页商品；下次进入商店列表时生效，异常时关闭此项" :checked="state.preferences.shopPageExperiment" @change="onPreference('shopPageExperiment',$event)"/>
   <SettingsToggle label="启动缓存按需重建（实验）" description="减少模组加载时重复重建故事缓存；更改后需保存进度并重启游戏，兼容异常时关闭后再重启" :checked="state.preferences.startupCacheLazy" @change="onPreference('startupCacheLazy',$event)"/>
   <p>这些功能默认关闭，可分别对比。它们只减少界面或缓存生成工作；购买、换装与存档规则保持原样。</p>
  </details>
  <section class="dmt-setting-card"><h3>兼容回退</h3><p>显示异常时可关闭新版主题、布局和专用界面。游戏进度与模组配置不受影响。</p><div class="dmt-recovery cu:flex cu:flex-wrap cu:gap-2"><GameButton @click="onRecovery(false)">回退原版界面</GameButton><GameButton @click="onRecovery(true)">启用新版界面</GameButton></div></section>
  <section class="dmt-setting-card cu:md:col-span-2"><h3>开发检查</h3><SettingsToggle label="状态接口预览（实验）" description="仅在需要排查状态接口时开启" :checked="state.preferences.statusPreview" @change="onPreference('statusPreview',$event)"/><div id="dol-status-preview" v-once></div></section>
 </div>
 <footer class="dmt-settings-footer"><p role="status">{{state.message}}</p></footer>
</template>
