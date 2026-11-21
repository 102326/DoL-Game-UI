<script setup lang="ts">
import {nextTick} from 'vue';
const props=defineProps<{label:string;description?:string;checked:boolean}>();
const emit=defineEmits<{change:[value:boolean]}>();
function change(event:Event){
 const input=event.currentTarget as HTMLInputElement;
 emit('change',input.checked);
 // A missing or busy consumer can decline without changing any reactive prop.
 void nextTick(()=>{input.checked=props.checked});
}
</script>
<template><label class="dgu-setting-row"><span><strong>{{label}}</strong><small v-if="description">{{description}}</small></span><input type="checkbox" :aria-label="label" :checked="checked" @change="change"></label></template>
