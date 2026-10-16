import {connectConsumer} from '../connect';
import {mountVue, vueView} from '../vue';
import ReadingPanel from './ReadingPanel.vue';
import './reading.css';
export const dispose = connectConsumer(host => {
 if (!host.getCapabilities?.().commands) return () => {};
 const owner = host.register('ReadingControls');
 try {
  if (host.getCapabilities?.().views) owner.provideView({id: 'reading', title: '阅读空间', setup: vueView({load: () => ReadingPanel, props: {host}})});
  mountVue(owner, {id: 'toolbar', parent: document.body, lifetime: 'persistent', load: () => ReadingPanel, props: {host, floating: true}});
 } catch {owner.dispose(); throw new Error('Reading controls unavailable')}
 return owner.dispose;
});
