import {mountVue, vueView} from '../vue';
import {provideNativeStatus} from './native-status';
import {connectConsumer} from '../connect';
import StatusPanel from './StatusPanel.vue';
import StatusInline from './StatusInline.vue';
import './panel.css';

export const dispose = connectConsumer(host => {
 const owner = provideNativeStatus(host, window);
 try {
  if (host.getCapabilities().views) owner.provideView({id: 'status', title: '状态速览', setup: vueView({load: () => StatusInline, props: {host}})});
  mountVue(owner, {id: 'preview', parent: document.body, lifetime: 'persistent', load: () => StatusPanel, props: {host, owner}})
 }
 catch {owner.dispose(); throw new Error('Status panel failed')}
 return owner.dispose;
});
