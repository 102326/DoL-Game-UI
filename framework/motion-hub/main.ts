import {connectConsumer} from '../connect';
import {mountVue, vueView} from '../vue';
import {provideNativeStatus} from '../examples/native-status';
import {provideNativeReading} from '../examples/native-reading';
import StatusInline from '../examples/StatusInline.vue';
import ComparisonInline from '../examples/ComparisonInline.vue';
import ReadingPanel from '../examples/ReadingPanel.vue';
import MotionHub from './MotionHub.vue';
import './style.css';

// Optional official UI experiment; the stable 2.7 floating tools remain untouched.
const disconnect = connectConsumer(host => {
 let owner: ReturnType<typeof host.register> | undefined;
 const adapters: Array<() => void> = [];
 const release = () => {owner?.dispose(); owner = undefined; for (const stop of adapters.splice(0).reverse()) stop()};
 try {
  if (!host.getCapabilities().views) return release;
  owner = host.register('StoneFreeMotionHub');
  if (!owner.claim('region', 'motion-hub')) {release(); return release}
  if (!host.sources('dol.status.experimental').length) {const adapter = provideNativeStatus(host, window, 'MotionHubStatus'); adapters.push(() => adapter.dispose())}
  if (!host.sources('dol.reading.experimental').length) {const adapter = provideNativeReading(host, window, 'MotionHubReading'); adapters.push(() => adapter.dispose())}
  for (const [id, title, component] of [['status', '状态速览', StatusInline], ['compare', '状态对照', ComparisonInline], ['reading', '原版侧栏', ReadingPanel]] as const)
   owner.provideView({id, title, setup: vueView({load: () => component, props: {host}})});
  mountVue(owner, {id: 'hub', parent: document.body, lifetime: 'persistent', load: () => MotionHub, props: {host, dismiss: () => dispose()}});
  return release;
 } catch (error) {release(); throw error}
});
export function dispose() {disconnect()}
