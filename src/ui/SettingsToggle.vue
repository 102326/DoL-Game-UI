<script setup lang="ts">
defineProps<{label:string;description?:string;checked:boolean}>();
defineEmits<{change:[value:boolean]}>();
</script>
<template><label class="dgu-setting-row"><span><strong>{{label}}</strong><small v-if="description">{{description}}</small></span><input type="checkbox" :aria-label="label" :checked="checked" @change="$emit('change',($event.target as HTMLInputElement).checked)"></label></template>
