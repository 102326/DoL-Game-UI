<script setup lang="ts">
import {ref, computed, onUnmounted} from 'vue';
import {useProjection} from '../vue';
import type {Host, MountContext, Command} from '../contracts';
const props = defineProps<{host: Host; hostContext: MountContext; floating?: boolean}>();
const {result, refresh} = useProjection(props.host, props.hostContext, 'dol.reading.experimental');
const command = ref<Command>(), busy = ref(false), uncertain = ref(false), message = ref('');
const state = computed(() => result.value?.ok && result.value.value && typeof result.value.value === 'object' && !Array.isArray(result.value.value) ? result.value.value : null);
function rescan() {const available = props.host.commands('dol.reading.experimental'); command.value = available.length === 1 ? available[0] : undefined}
const stop = props.host.onCommands(rescan); rescan(); onUnmounted(stop);
async function toggle() {
 if (busy.value || uncertain.value || !command.value) return;
 busy.value = true; message.value = '';
 try {
  const reply = await command.value.invoke(props.hostContext.binding());
  if (!props.hostContext.isCurrent()) return;
  if (reply.status === 'unknown') {uncertain.value = true; message.value = '结果未确认，请用原版入口查看；这里不再重复执行。'}
  else if (reply.status !== 'returned') message.value = `当前无法执行：${reply.status}`;
  else {const value = reply.value; message.value = value && typeof value === 'object' && !Array.isArray(value) && value.applied === true ? '原版侧栏已切换。' : '原控件暂不可用，未确认切换。'}
  await refresh();
 } finally {busy.value = false}
}
</script>
<template>
 <section class="sf-reading" :class="{'sf-reading-floating': floating}" aria-label="阅读空间">
  <span>原版侧栏（采样）：{{state?.stowed === true ? '收起' : state?.stowed === false ? '展开' : '未知'}}</span>
  <div class="sf-inline-actions"><button type="button" :disabled="busy || uncertain || !command || !state?.available" @click="toggle">切换侧栏</button><button type="button" @click="refresh">刷新</button></div>
  <p v-if="message" role="status">{{message}}</p><p v-else-if="state && !state.available" class="sf-inline-note">请先关闭浮层，或使用原版侧栏入口。</p>
 </section>
</template>
