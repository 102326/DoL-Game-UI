<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, watch} from 'vue';
import type {MountHandle, View} from '../contracts';
const props = defineProps<{view: View; instance: string}>();
const target = ref<HTMLElement>(), failed = ref(false);
let handle: Readonly<MountHandle> | null = null, turn = 0;
async function mount() {
 const ticket = ++turn; handle?.dispose(); handle = null; failed.value = false;
 if (!target.value?.isConnected) return;
 try {
  const active = props.view.mount({id: props.instance, parent: target.value, lifetime: 'persistent'});
  handle = active;
  if (!active) {failed.value = true; return}
  await active.ready;
  if (ticket === turn) failed.value = !active.isCurrent();
 } catch {failed.value = true}
}
onMounted(mount); watch(() => props.view.mount, mount);
onBeforeUnmount(() => {turn++; handle?.dispose(); handle = null});
</script>
<template>
 <div ref="target" class="sf-view-outlet" />
 <p v-if="failed" role="status">该视图暂不可用。<button type="button" @click="mount">重新载入</button></p>
</template>
