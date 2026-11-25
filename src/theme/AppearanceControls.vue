<script setup lang="ts">
import {computed, onBeforeUnmount, ref, shallowRef, watch} from 'vue';
import GameButton from '../ui/GameButton.vue';
import {appearanceFont, appearancePalette, colorDefaults, colorRoles, emptyAppearance, fontPattern, readAppearance, type Appearance, type ColorRole} from './appearance';

import {decodeLocalFont, importedFamily} from './local-font';
const props = defineProps<{appearance: Appearance;previewTheme?:typeof appearancePalette;presets?:Readonly<Record<string,Appearance['colors']>>;importedName?:string;onSaveFont?:(file:File|null)=>Promise<void>}>();
const emit = defineEmits<{apply: [appearance: Appearance]}>();
const draft = ref(readAppearance(props.appearance));
const selection = shallowRef<File|null>();
const preview = shallowRef<FontFace>();
const loading = ref(false), saving = ref(false), notice = ref('');
let generation = 0;
function clearSelection() {
 generation++;
 if(preview.value)document.fonts.delete(preview.value);
 preview.value=undefined;selection.value=undefined;loading.value=false;notice.value='';
}
onBeforeUnmount(clearSelection);
async function selectFile(event: Event) {
 const input=event.currentTarget as HTMLInputElement;
 const file=input.files?.[0]; input.value='';
 if(!file)return;
 clearSelection();const ticket=generation;
 loading.value=true;
 try {
  const face=await decodeLocalFont(file,'SoftWet TTF Preview');
  if(ticket!==generation)return;
  document.fonts.add(face);preview.value=face;selection.value=file;
 } catch(error) {
  if(ticket===generation)notice.value=error instanceof Error?error.message:'无法预览字体。';
 } finally {if(ticket===generation)loading.value=false}
}
function cancelDraft(){clearSelection();draft.value=readAppearance(props.appearance)}
async function applyDraft(reset=false) {
 const value=reset?emptyAppearance():readAppearance(draft.value);
 const file=reset?null:selection.value;
 saving.value=true;notice.value='';
 try {
  if(file!==undefined && props.onSaveFont)await props.onSaveFont(file);
  emit('apply',value);clearSelection();draft.value=value;
 } catch {notice.value='字体未保存。请检查本地存储空间和浏览器权限后重试。'}
 finally {saving.value=false}
}
watch(() => props.appearance, value => {draft.value = readAppearance(value)});
const labels: Record<ColorRole, string> = {background:'界面底色',panel:'面板',text:'主要文字',muted:'次要文字',accent:'强调色'};
const validatedFont = computed(() => draft.value.font.trim());
const fontValid = computed(() => !validatedFont.value || fontPattern.test(validatedFont.value));
const sample = computed(() => (props.previewTheme??appearancePalette)(draft.value.colors));
const sampleStyle = computed(() => {
 const p = sample.value.palette;
 return {'--sample-bg':p.background,'--sample-panel':p.panel,'--sample-text':p.text,'--sample-muted':p.muted,
  '--sample-accent':p.accent,'--sample-on-accent':p.onAccent,
  fontFamily:(preview.value ? '"SoftWet TTF Preview", ' : selection.value!==null && props.importedName ? `"${importedFamily}", ` : '')+appearanceFont(fontValid.value ? validatedFont.value : '')};
});
const dirty = computed(() => selection.value!==undefined || validatedFont.value !== props.appearance.font
 || colorRoles.some(role => draft.value.colors[role] !== props.appearance.colors[role]));
function setColor(role: ColorRole, value: string) {
 if (/^#[0-9a-f]{6}$/i.test(value)) draft.value.colors[role] = value.toLowerCase();
}
</script>

<template>
 <div class="dmt-setting-card dmt-control-sheet sw-appearance">
  <div class="sw-appearance-fields">
   <h3>颜色与字体</h3>
   <div v-if="presets" class="dmt-workspace-actions" aria-label="暗色预设">
    <GameButton v-for="(colors,id) in presets" :key="id" @click="draft.colors={...colors}">{{ id==='slate'?'青灰':'石墨灰' }}</GameButton>
   </div>
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
   <template v-if="onSaveFont">
    <label class="sw-appearance-font"><span>导入本地 TTF</span>
     <input type="file" accept=".ttf,font/ttf" :disabled="saving" @change="selectFile">
    </label>
    <p>选好文件后先看右侧或下方预览，应用后字体保存在当前浏览器。缺少的字形沿用本机字体。</p>
    <p v-if="selection || (selection!==null && importedName)">{{ selection ? '待应用' : '已应用' }} · {{ selection?.name ?? importedName }}
     <GameButton :disabled="saving" @click="clearSelection();selection=importedName?null:undefined">移除导入字体</GameButton>
    </p>
    <p role="status">{{ loading ? '正在读取字体…' : notice }}</p>
   </template>
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
   <GameButton :disabled="saving || loading || !fontValid || !dirty" @click="applyDraft()">应用并保存</GameButton>
   <GameButton v-if="presets || onSaveFont" :disabled="saving || (!dirty && !loading)" @click="cancelDraft">取消试色</GameButton>
   <GameButton :disabled="saving" @click="applyDraft(true)">恢复默认外观</GameButton>
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
.sw-appearance-font input{width:100%;min-width:0;min-height:var(--dgu-control-hit,44px);font:inherit;padding:var(--dgu-control-py,6px) var(--dgu-control-px,10px)}
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
