<script setup lang="ts">
import {computed} from 'vue';
import {useProjection} from '../vue';
import type {Host, MountContext} from '../contracts';
const props = defineProps<{host: Host; hostContext: MountContext}>();
const {result, source, loading, refresh} = useProjection(props.host, props.hostContext, 'dol.status.experimental');
const labels: Record<string, string> = {pain: '疼痛', stress: '压力', tiredness: '疲劳'};
const values = computed(() => result.value?.ok && result.value.value && typeof result.value.value === 'object' && !Array.isArray(result.value.value) ? result.value.value : null);
</script>
<template>
 <dl v-if="values"><div v-for="(value, field) in values" :key="field"><dt>{{labels[field] ?? field}}</dt><dd>{{value ?? '未知'}}</dd></div></dl>
 <p v-else role="status">{{result && !result.ok ? `当前不可用：${result.reason}` : '等待状态来源'}}</p>
 <p class="sf-inline-note">{{loading ? '正在采样' : '按需采样'}} · {{source?.owner ?? '来源未安装'}}</p>
 <div class="sf-inline-actions"><button type="button" @click="refresh">刷新状态</button></div>
</template>
