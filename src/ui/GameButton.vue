<script setup lang="ts">
defineOptions({inheritAttrs:false});
withDefaults(defineProps<{disabled?:boolean;type?:'button'|'submit'|'reset'}>(),{type:'button'});
</script>
<template><button v-bind="$attrs" :type="type" :disabled="disabled"><slot /></button></template>
