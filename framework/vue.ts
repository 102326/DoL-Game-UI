import {createApp, type Component} from 'vue';
import type {MountContext, MountRequest, Participant} from './contracts';

/** Each consumer owns its Vue App/runtime; no official UI store or theme imports. */
export function mountVue(owner: Participant, request: Omit<MountRequest, 'setup'> & {
 load(): Component | Promise<Component>;
 props?: Record<string, unknown>;
 onReady?: (context: MountContext) => void;
}) {
 return owner.mount({...request, async setup(context) {
  const component = await request.load();
  if (!context.isCurrent() || context.signal.aborted) return;
  const app = createApp(component, {...request.props, hostContext: context});
  let mounted = false;
  context.onCleanup(() => {if (mounted) app.unmount()});
  app.config.errorHandler = () => context.fail();
  mounted = true; app.mount(context.element);
  if (!context.isCurrent()) {app.unmount(); return}
  request.onReady?.(context);
 }});
}
