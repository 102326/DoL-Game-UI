<script setup lang="ts">
import type {PanelKind} from '../panels/main';
import GameButton from '../ui/GameButton.vue';
import SettingsToggle from '../ui/SettingsToggle.vue';
import type {SettingsState,PreferenceKey} from './preferences';
import type {UiApi} from '../public/ui';
const props=defineProps<{state:SettingsState;onPreference:(key:PreferenceKey,value:boolean|number)=>void;onSaves:(value:boolean)=>void;onCombat:(value:boolean)=>void;onCharacteristics:(value:boolean)=>void;onSocial:(value:boolean)=>void;onShop:(value:boolean)=>void;onPanel:(kind:PanelKind,value:boolean)=>void;onWardrobe:(value:boolean)=>void;onClose:()=>void;onRecovery:(enabled:boolean)=>void}>();
function wardrobeChange(event:Event){const input=event.target as HTMLSelectElement;props.onWardrobe(input.value==='new');input.value=props.state.wardrobe?'new':'original'}
function inspectRuntime(){try{(window as Window & {DoLGameUI?:{ui?:Pick<UiApi,'openInspector'>}}).DoLGameUI?.ui?.openInspector?.()}catch{/* UI diagnostics must not affect settings. */}}
</script>
<template>
 <header class="dmt-settings-header cu:flex cu:items-center cu:justify-between cu:gap-4"><div><p class="dmt-eyebrow">SOFT &amp; WET</p><h2 id="dol-midnight-title">界面设置</h2></div><GameButton class="dmt-close" @click="onClose">关闭</GameButton></header>
 <div class="dmt-controls-content cu:grid cu:gap-4 cu:md:grid-cols-2">
  <section class="dmt-setting-card"><h3>主题与阅读</h3>
   <SettingsToggle label="启用 Soft & Wet 2.0 界面" description="关闭后返回原版界面；页面和显示选择会保留，重新开启时恢复" :checked="state.preferences.enabled" @change="onPreference('enabled',$event)"/>
   <SettingsToggle label="舒适阅读间距" :checked="state.preferences.comfortable" @change="onPreference('comfortable',$event)"/>
   <SettingsToggle label="宽幅正文" :checked="state.preferences.wideReading" @change="onPreference('wideReading',$event)"/>
  </section>
  <section class="dmt-setting-card"><h3>材质与动效</h3>
   <label class="dgu-setting-row"><span>效果档位</span><select aria-label="视觉效果档位" :value="state.preferences.visualTier" @change="onPreference('visualTier',Number(($event.target as HTMLSelectElement).value))"><option :value="0">流畅</option><option :value="1">均衡</option><option :value="2">华丽</option></select></label>
   <SettingsToggle label="玻璃模糊" :checked="state.preferences.visualGlass" @change="onPreference('visualGlass',$event)"/>
   <SettingsToggle label="交互与进入动画" :checked="state.preferences.visualMotion" @change="onPreference('visualMotion',$event)"/>
   <SettingsToggle label="光影高光" :checked="state.preferences.visualGlow" @change="onPreference('visualGlow',$event)"/>
   <p>流畅档不使用模糊。均衡与华丽共享布局，主要区别是材质强度；系统减少动态效果设置优先。</p>
  </section>
  <section class="dmt-setting-card"><h3>字体与按钮大小</h3><p>调整主界面与弹窗；侧边栏与模组管理弹窗保持原有大小。</p>
<label v-for="item in ([{key:'fontScale',label:'字体'},{key:'buttonScale',label:'按钮'}] as const)" :key="item.key" class="dgu-setting-row"><span>{{item.label}} {{state.preferences[item.key]}}%</span><input type="range" min="50" :max="state.scaleMax" step="5" :aria-label="item.label+'大小'" :value="state.preferences[item.key]" @input="onPreference(item.key,Number(($event.target as HTMLInputElement).value))"/></label>
<GameButton @click="onPreference('fontScale',100);onPreference('buttonScale',100)">恢复 100%</GameButton><p>当前范围 50%–{{state.scaleMax}}%。图片保持原大小。</p>
   <SettingsToggle label="手机紧凑按钮间距" description="缩小操作控件的留白，保留至少 44px 点击区域；仅在手机尺寸生效" :checked="state.preferences.mobileCompactControls" @change="onPreference('mobileCompactControls',$event)"/>
  </section>
<section class="dmt-setting-card"><h3>侧栏与布局</h3>
   <SettingsToggle label="启用响应式布局" description="适配手机抽屉与平板侧栏；关闭可恢复原版布局" :checked="state.preferences.layout" @change="onPreference('layout',$event)"/>
   <SettingsToggle label="紧凑状态间距" :checked="state.preferences.compactStats" @change="onPreference('compactStats',$event)"/>
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
   <label class="dgu-setting-row" for="dmt-wardrobe"><span><strong>衣柜界面</strong></span><select id="dmt-wardrobe" aria-label="衣柜界面" :value="state.wardrobe?'new':'original'" @change="wardrobeChange"><option value="new">新版穿搭衣柜</option><option value="original">原版衣柜（兼容回退）</option></select></label>
   <SettingsToggle v-if="state.wardrobe" label="衣柜按页渲染" description="每页显示 40 件；搜索、排序和全选仍覆盖整个分类" :checked="state.preferences.wardrobePaged" @change="onPreference('wardrobePaged',$event)"/>
   <p>这些选项只调整显示，不改变存档或衣物数据。</p>
  </section>
  <details class="dmt-setting-card dmt-experiments"><summary><strong>进阶实验与外观细节</strong><span>默认收起，按需启用</span></summary>
   <SettingsToggle label="标题边缘纹样" description="可选静态装饰" :checked="state.preferences.visualPattern" @change="onPreference('visualPattern',$event)"/>
   <SettingsToggle label="衣柜延迟原版隐藏列表（实验）" description="新版衣柜换装时暂不重建隐藏的原版列表；出现兼容问题时关闭此项" :checked="state.preferences.wardrobeHiddenList" @change="onPreference('wardrobeHiddenList',$event)"/>
   <SettingsToggle label="商店离屏绘制延后（实验）" description="让支持的浏览器跳过屏幕外商品的排版与绘制；滚动异常时关闭此项" :checked="state.preferences.shopDeferredPaint" @change="onPreference('shopDeferredPaint',$event)"/>
   <SettingsToggle v-if="state.shopPageExperimentAvailable" label="商店按页生成（实验）" description="只生成当前页商品；下次进入商店列表时生效，异常时关闭此项" :checked="state.preferences.shopPageExperiment" @change="onPreference('shopPageExperiment',$event)"/>
   <SettingsToggle label="启动缓存按需重建（实验）" description="减少模组加载时重复重建故事缓存；更改后需保存进度并重启游戏，兼容异常时关闭后再重启" :checked="state.preferences.startupCacheLazy" @change="onPreference('startupCacheLazy',$event)"/>
   <p>这些功能默认关闭，可分别对比。它们只减少界面或缓存生成工作；购买、换装与存档规则保持原样。</p>
  </details>
  <section class="dmt-setting-card"><h3>兼容回退</h3><p>关闭 Soft & Wet 2.0 后返回原版界面；重新启用会恢复保留的页面与显示选择。游戏进度与模组配置不受影响。</p><div class="dmt-recovery cu:flex cu:flex-wrap cu:gap-2"><GameButton @click="onRecovery(false)">回退原版界面</GameButton><GameButton @click="onRecovery(true)">启用新版界面</GameButton></div></section>
  <details class="dmt-setting-card dmt-debug cu:md:col-span-2"><summary><strong>开发检查</strong><span>仅排查问题时使用</span></summary><GameButton :disabled="!state.preferences.enabled" @click="inspectRuntime">Runtime Inspector</GameButton><p>只读查看能力、Adapter 和降级原因；可复制诊断。需要启用 Soft &amp; Wet。</p><SettingsToggle label="状态接口预览（实验）" description="仅在需要排查状态接口时开启" :checked="state.preferences.statusPreview" @change="onPreference('statusPreview',$event)"/><div id="dol-status-preview" v-once></div></details>
 </div>
 <footer class="dmt-settings-footer"><p role="status">{{state.message}}</p></footer>
</template>
