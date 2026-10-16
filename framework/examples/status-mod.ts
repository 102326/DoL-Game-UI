import {mountVue} from '../vue';
import {provideNativeStatus} from './native-status';
import {connectConsumer} from '../connect';
import StatusPanel from './StatusPanel.vue';
import './panel.css';

connectConsumer(host => {
 const owner = provideNativeStatus(host, window);
 try {mountVue(owner, {id: 'preview', parent: document.body, lifetime: 'persistent', load: () => StatusPanel, props: {host, owner}})}
 catch {owner.dispose(); throw new Error('Status panel failed')}
 return owner.dispose;
});
