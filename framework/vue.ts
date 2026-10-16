import {createApp, shallowRef, shallowReadonly, onUnmounted, type Component} from 'vue';
import type {Host, ReadResult, MountContext, MountRequest, Participant} from './contracts';

/** Each consumer owns its Vue App/runtime; no official UI store or theme imports. */
interface VueRequest {
 load(): Component | Promise<Component>;
 props?: Record<string, unknown>;
 onReady?: (context: MountContext) => void;
}
export function vueView(request: VueRequest): MountRequest['setup'] {
 return async context => {
  const component = await request.load();
  if (!context.isCurrent() || context.signal.aborted) return;
  const app = createApp(component, {...request.props, hostContext: context});
  let mounted = false;
  context.onCleanup(() => {if (mounted) app.unmount()});
  app.config.errorHandler = () => context.fail();
  mounted = true; app.mount(context.element);
  if (!context.isCurrent()) {app.unmount(); return}
  request.onReady?.(context);
 };
}
export function mountVue(owner: Participant, request: Omit<MountRequest, 'setup'> & VueRequest) {
 return owner.mount({...request, setup: vueView(request)});
}

/** Per-view sampled projection, not a reactive mirror of game State. */
export function useProjection(host: Host, context: MountContext, schema: string) {
 const result = shallowRef<ReadResult | null>(null), source = shallowRef<{owner: string; id: string} | null>(null), loading = shallowRef(false);
 let turn = 0, stopped = false, binding: ReturnType<MountContext['binding']> | undefined;
 function stale() {turn++; result.value = {ok: false, reason: 'stale'}; loading.value = false}
 async function refresh() {
  const ticket = ++turn;
  binding?.signal.removeEventListener('abort', stale);
  if (stopped || !context.isCurrent()) return;
  binding = context.binding(); binding.signal.addEventListener('abort', stale, {once: true});
  const target = host.sources(schema)[0];
  source.value = target ? {owner: target.owner, id: target.id} : null;
  if (!target) {result.value = {ok: false, reason: 'missing'}; loading.value = false; return}
  loading.value = true;
  const next = await target.read(binding);
  if (stopped || ticket !== turn || !context.isCurrent()) return;
  result.value = next; loading.value = false;
 }
 const stopSource = host.onContributions(() => {void refresh()}), stopScene = context.onScene(() => {void refresh()});
 onUnmounted(() => {stopped = true; turn++; binding?.signal.removeEventListener('abort', stale); stopSource(); stopScene()});
 void refresh();
 return {result: shallowReadonly(result), source: shallowReadonly(source), loading: shallowReadonly(loading), refresh};
}
