import {connectConsumer} from '../connect';
import {mountVue} from '../vue';
import Panel from './SurfacePanel.vue';
import './panel.css';

/** Optional official shell consumes the same public views as independent layouts. */
export const dispose = connectConsumer(host => {
 const owner = host.register('SoftWetSurface');
 try {mountVue(owner, {id: 'surface-entry', parent: document.body, lifetime: 'persistent', load: () => Panel, props: {host, owner}})}
 catch {owner.dispose(); throw Error('Official consumer mount failed')}
 return owner.dispose;
});
