<script setup lang="ts">
import {computed, shallowRef} from 'vue';
import {useProjection} from '../vue';
import type {Host, Json, MountContext} from '../contracts';
const props = defineProps<{host: Host; hostContext: MountContext}>();
const {result, source, loading, refresh} = useProjection(props.host, props.hostContext, 'dol.status.experimental');
const baseline = shallowRef<Readonly<Record<string, Json>> | null>(null);
const labels: Record<string, string> = {pain: '疼痛', stress: '压力', tiredness: '疲劳'};
const values = computed(() => result.value?.ok && result.value.value && typeof result.value.value === 'object' && !Array.isArray(result.value.value) ? result.value.value : null);
function compare() {if (values.value) baseline.value = values.value as Readonly<Record<string, Json>>}
function delta(key: string, value: unknown) {const old = baseline.value?.[key]; return typeof old === 'number' && typeof value === 'number' ? value - old : '—'}
props.hostContext.onScene(() => {baseline.value = null});
</script>
<template>
 <table v-if="values"><thead><tr><th>项目</th><th>当前</th><th>对照</th><th>变化</th></tr></thead><tbody><tr v-for="(value, field) in values" :key="field"><th>{{labels[field] ?? field}}</th><td>{{value ?? '未知'}}</td><td>{{baseline?.[field] ?? '—'}}</td><td>{{delta(field, value)}}</td></tr></tbody></table>
 <p v-else role="status">状态来源暂不可用。</p>
 <p class="sf-inline-note">{{source?.owner ?? '无来源'}} · {{loading ? '正在读取' : '对照仅在当前打开期间保留'}}</p>
 <div class="sf-inline-actions"><button type="button" :disabled="!values" @click="compare">设为对照</button><button type="button" @click="refresh">刷新对照</button></div>
</template>
