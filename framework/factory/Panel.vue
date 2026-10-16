<script setup lang="ts">
import {ref} from 'vue';
defineProps<{floating?: boolean}>();
const expanded = ref(false), note = ref('');
</script>
<template>
 <aside class="author-note" :class="{'author-note-floating': floating}">
  <button v-if="floating" type="button" @click="expanded = !expanded">界面便笺</button>
  <label v-if="!floating || expanded">仅当前视图保留<textarea v-model="note" aria-label="界面便笺" /></label>
 </aside>
</template>
<style scoped>
.author-note {max-width:100%;box-sizing:border-box;font:14px/1.5 system-ui;color:inherit}
.author-note-floating {position:fixed;right:12px;bottom:12px;z-index:800;max-width:min(340px,calc(100vw - 24px));color:#e8edf3;background:#232b32ee;border:1px solid #ffffff16;border-radius:12px;padding:10px}
button,textarea {font:inherit;color:inherit;background:#ffffff09;border:1px solid #ffffff20;border-radius:8px;padding:8px;box-sizing:border-box}
label {display:grid;gap:8px;margin-top:8px}textarea {width:100%;min-height:96px;resize:vertical}
</style>
