<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import GameButton from '../ui/GameButton.vue';
import {appearanceFont, appearancePalette, colorDefaults, colorRoles, emptyAppearance, fontPattern, readAppearance, type Appearance, type ColorRole} from './appearance';

const props = defineProps<{appearance: Appearance}>();
const emit = defineEmits<{apply: [appearance: Appearance]}>();
const draft = ref(readAppearance(props.appearance));
watch(() => props.appearance, value => {draft.value = readAppearance(value)});
const labels: Record<ColorRole, string> = {background:'界面底色',panel:'面板',text:'主要文字',muted:'次要文字',accent:'强调色'};
const validatedFont = computed(() => draft.value.font.trim());
const fontValid = computed(() => !validatedFont.value || fontPattern.test(validatedFont.value));
const sample = computed(() => appearancePalette(draft.value.colors));
const sampleStyle = computed(() => {
 const p = sample.value.palette;
 return {'--sample-bg':p.background,'--sample-panel':p.panel,'--sample-text':p.text,'--sample-muted':p.muted,
  '--sample-accent':p.accent,'--sample-on-accent':p.onAccent,
  fontFamily:appearanceFont(fontValid.value ? validatedFont.value : '')};
});
const dirty = computed(() => validatedFont.value !== props.appearance.font
 || colorRoles.some(role => draft.value.colors[role] !== props.appearance.colors[role]));
function setColor(role: ColorRole, value: string) {
 if (/^#[0-9a-f]{6}$/i.test(value)) draft.value.colors[role] = value.toLowerCase();
}
</script>

<template>
 <div class="dmt-setting-card dmt-control-sheet sw-appearance">
  <div class="sw-appearance-fields">
   <h3>颜色与字体</h3>
   <div class="sw-appearance-colors">
    <label v-for="role in colorRoles" :key="role">
     <span>{{ labels[role] }}</span>
     <input type="color" :value="draft.colors[role] ?? colorDefaults[role]" @input="setColor(role, ($event.target as HTMLInputElement).value)">
    </label>
   </div>
   <label class="sw-appearance-font">
    <span>本机字体</span>
    <input v-model="draft.font" type="text" maxlength="64" list="sw-local-fonts" autocomplete="off"
     placeholder="留空使用默认字体" aria-describedby="sw-local-font-help" :aria-invalid="!fontValid">
   </label>
   <datalist id="sw-local-fonts">
    <option value="PingFang SC"/><option value="Microsoft YaHei"/><option value="Noto Sans CJK SC"/>
    <option value="Noto Serif CJK SC"/><option value="Georgia"/><option value="Verdana"/><option value="Menlo"/>
   </datalist>
   <p id="sw-local-font-help">{{ fontValid ? '填写已安装的字体名称。缺少字体或字形时会使用系统字体。' : '请填写一个字体名称，可用文字、数字、空格、点、下划线和连字符。' }}</p>
  </div>
  <div class="sw-appearance-sample" :style="sampleStyle" aria-label="颜色与字体预览">
   <strong>外观预览</strong>
   <div class="sw-appearance-sample-panel">
    <strong>阅读与操作 · Soft &amp; Wet</strong>
    <small>中文、Latin 123 与次要文字</small>
    <div class="sw-appearance-states"><span>已选中</span><span>焦点</span><span>错误提示</span></div>
   </div>
   <small v-if="sample.adjusted" role="status">部分颜色已校正，以保持暗色材质和文字对比。</small>
  </div>
  <div class="dmt-workspace-actions sw-appearance-actions">
   <GameButton :disabled="!fontValid || !dirty" @click="emit('apply', readAppearance(draft))">应用并保存</GameButton>
   <GameButton @click="emit('apply', emptyAppearance())">恢复默认外观</GameButton>
  </div>
 </div>
</template>

<style scoped>
.sw-appearance{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,235px),1fr));gap:16px;min-width:0}
.sw-appearance-fields{min-width:0}
.sw-appearance-fields h3{margin:0 0 10px}
.sw-appearance-colors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,94px),1fr));gap:6px}
.sw-appearance-colors label{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:4px;padding:3px 6px;border:1px solid #ffffff12;border-radius:8px}
.sw-appearance-colors input{width:44px;min-height:44px;flex:none;padding:3px;border-radius:8px;background:transparent;border:0;cursor:pointer}
.sw-appearance-font{display:grid;gap:4px;margin-top:12px}
.sw-appearance-font input{width:100%;min-width:0;min-height:44px;font:inherit;padding:6px 10px}
.sw-appearance-fields p{margin:6px 0 0;font-size:.85em}
.sw-appearance-sample{display:grid;align-content:start;gap:8px;min-width:0;overflow-wrap:anywhere;padding:12px;border:1px solid #ffffff20;border-radius:12px;background:var(--sample-bg);color:var(--sample-text)}
.sw-appearance-sample-panel{display:grid;gap:5px;padding:10px;border-radius:8px;background:var(--sample-panel)}
.sw-appearance-sample small{color:var(--sample-muted)}
.sw-appearance-states{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0}
.sw-appearance-states span{padding:3px 6px;border-radius:4px}
.sw-appearance-states span:first-child{background:var(--sample-accent);color:var(--sample-on-accent)}
.sw-appearance-states span:nth-child(2){outline:1px solid var(--sample-accent)}
.sw-appearance-states span:last-child{color:#ffb0b0}
.sw-appearance-actions{grid-column:1/-1;margin:0;flex-wrap:wrap}
</style>
